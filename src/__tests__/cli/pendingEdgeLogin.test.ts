import { describe, expect, it } from '@jest/globals'

import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import type { RouteContext } from '../../cli/engine/router'
import { pollEdgeLogin, requestEdgeLogin } from '../../cli/engine/routes/login'

/**
 * Who owns the session a QR login creates.
 *
 * The watcher calls `ensureEdgeSession` the moment the phone approves,
 * whether or not anyone is polling — that is what makes `--no-wait` work. So
 * between the approval and the first poll the engine holds a logged-in
 * account whose id no process has seen, and the handle is its only owner.
 * These two cases pin the handover: expiry logs out a session nobody was
 * told about, and leaves alone one that has been reported.
 */

/** A fake `EdgePendingEdgeLogin` whose state a test drives by hand. */
function makeFakePending(): {
  pending: Record<string, unknown>
  approve: () => void
  cancelled: () => boolean
} {
  let watcher: ((state: string) => void) | undefined
  let cancelRequested = false
  const pending: Record<string, unknown> = {
    id: 'lobby123',
    state: 'pending',
    username: 'clitester',
    account: undefined,
    watch(name: string, callback: (state: string) => void) {
      expect(name).toBe('state')
      watcher = callback
      return () => {
        watcher = undefined
      }
    },
    async cancelRequest() {
      cancelRequested = true
    }
  }
  return {
    pending,
    approve: () => {
      pending.account = { username: 'clitester' }
      pending.state = 'done'
      watcher?.('done')
    },
    cancelled: () => cancelRequested
  }
}

interface Harness {
  /**
   * `as any` at the two call sites below, not here.
   *
   * `route()` types a handler's context as `TypedContext<Q, B>`, whose
   * `query` carries the cleaned `valid` object the router attaches. A stub
   * that satisfies that type would have to restate both routes' cleaners,
   * which is a second copy of the declaration; `RouteContext` is what the
   * router really passes.
   */
  ctx: RouteContext
  objects: ObjectHandleStore
  approve: () => void
  loggedOut: string[]
  liveSessions: Set<string>
}

function makeHarness(): Harness {
  const objects = new ObjectHandleStore()
  const { pending, approve } = makeFakePending()
  const loggedOut: string[] = []
  const liveSessions = new Set<string>()
  let nextId = 0

  const ctx = {
    params: {},
    query: new URLSearchParams(),
    body: {},
    state: {
      objects,
      core: {
        context: {
          async requestEdgeLogin() {
            return pending
          }
        }
      },
      sessions: {
        async create() {
          const sessionId = `sess_${++nextId}`
          liveSessions.add(sessionId)
          return { sessionId, username: 'clitester', loginMethod: 'edge' }
        },
        peek(sessionId: string) {
          return liveSessions.has(sessionId)
            ? { sessionId, username: 'clitester' }
            : null
        },
        async forceLogout(sessionId: string) {
          loggedOut.push(sessionId)
          liveSessions.delete(sessionId)
        }
      }
    }
  } as unknown as RouteContext

  return { ctx, objects, approve, loggedOut, liveSessions }
}

/** Run `request-edge-login`, approve on the phone, and settle the watcher. */
async function approvedLogin(h: Harness): Promise<string> {
  const result = (await requestEdgeLogin.handler(h.ctx as never)) as {
    pendingId: string
  }
  h.approve()
  // `ensureEdgeSession` is started from the watcher and not awaited there, so
  // the session appears a few microtasks later. Draining the queue rather
  // than waiting on a timer keeps the test synchronous.
  for (let i = 0; i < 20 && h.liveSessions.size === 0; i++) {
    await Promise.resolve()
  }
  expect(h.liveSessions.size).toBe(1)
  return result.pendingId
}

describe('a pending edge login that nobody claimed', () => {
  it('is logged out when the handle expires', async () => {
    const h = makeHarness()
    const pendingId = await approvedLogin(h)

    // The sweeper's one action for an expired handle.
    await h.objects.delete(pendingId)

    expect(h.loggedOut).toStrictEqual(['sess_1'])
    expect(h.liveSessions.size).toBe(0)
  })

  it('survives the expiry once a poll has reported it', async () => {
    const h = makeHarness()
    const pendingId = await approvedLogin(h)

    h.ctx.params.pendingId = pendingId
    const polled = (await pollEdgeLogin.handler(h.ctx as never)) as {
      session: { sessionId: string } | null
    }
    expect(polled.session?.sessionId).toBe('sess_1')

    await h.objects.delete(pendingId)

    expect(h.loggedOut).toStrictEqual([])
    expect(h.liveSessions.has('sess_1')).toBe(true)
  })
})
