import { describe, expect, it } from '@jest/globals'

import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import type { RouteContext } from '../../cli/engine/router'
import { requireOwnedHandle } from '../../cli/engine/routes/helpers'

/** The error shape `engineError` produces. */
interface ThrownEngineError extends Error {
  code: string
  status: number
}

function thrown(fn: () => unknown): { code: string; status: number } {
  try {
    fn()
  } catch (error) {
    const engineError = error as ThrownEngineError
    return { code: engineError.code, status: engineError.status }
  }
  throw new Error('expected a throw')
}

/**
 * Just enough context for `requireOwnedHandle`: a handle store, and a session
 * store that answers for exactly one session id the way `SessionStore` does.
 */
function makeCtx(opts: {
  objects: ObjectHandleStore
  sessionId: string
  liveSessionId?: string
}): RouteContext {
  const { objects, sessionId, liveSessionId } = opts
  const engineError = (
    code: string,
    message: string,
    status: number
  ): ThrownEngineError => {
    const error = new Error(message) as ThrownEngineError
    error.code = code
    error.status = status
    return error
  }
  return {
    params: { sessionId, objectId: '' },
    state: {
      objects,
      sessions: {
        get(id: string) {
          if (id !== liveSessionId) {
            throw engineError('INVALID_SESSION', 'Unknown sessionId', 401)
          }
          return { account: {} }
        },
        touch() {}
      }
    }
  } as unknown as RouteContext
}

describe('requireOwnedHandle', () => {
  it('resolves the session before comparing the handle', () => {
    const objects = new ObjectHandleStore()
    const { objectId } = objects.create({
      kind: 'transaction',
      prefix: 'tx_',
      value: { txid: 'a' },
      sessionId: 'live'
    })

    const ctx = makeCtx({ objects, sessionId: 'live', liveSessionId: 'live' })
    expect(
      requireOwnedHandle(ctx, objectId, 'transaction').value
    ).toStrictEqual({ txid: 'a' })
  })

  it('rejects a session id the session store no longer knows', () => {
    const objects = new ObjectHandleStore()
    const { objectId } = objects.create({
      kind: 'transaction',
      prefix: 'tx_',
      value: { txid: 'a' },
      sessionId: 'dead'
    })

    // A logged-out session still matches the handle's recorded id, so a
    // string comparison alone would authorise this call for the rest of the
    // handle's TTL.
    const ctx = makeCtx({ objects, sessionId: 'dead', liveSessionId: 'live' })
    expect(
      thrown(() => requireOwnedHandle(ctx, objectId, 'transaction'))
    ).toStrictEqual({
      code: 'INVALID_SESSION',
      status: 401
    })
  })

  it('rejects a fabricated session id on a handle that has none', () => {
    const objects = new ObjectHandleStore()
    const { objectId } = objects.create({
      kind: 'pendingLogin',
      prefix: 'pending_',
      value: { pendingId: '' }
    })

    // Every pending login is stored without a `sessionId`, so the ownership
    // comparison is skipped and the session lookup is the only check left.
    const ctx = makeCtx({
      objects,
      sessionId: 'made-up',
      liveSessionId: 'live'
    })
    expect(thrown(() => requireOwnedHandle(ctx, objectId))).toStrictEqual({
      code: 'INVALID_SESSION',
      status: 401
    })
  })

  it('still reports a handle owned by a different live session', () => {
    const objects = new ObjectHandleStore()
    const { objectId } = objects.create({
      kind: 'transaction',
      prefix: 'tx_',
      value: { txid: 'a' },
      sessionId: 'other'
    })

    const ctx = makeCtx({ objects, sessionId: 'live', liveSessionId: 'live' })
    expect(
      thrown(() => requireOwnedHandle(ctx, objectId, 'transaction'))
    ).toStrictEqual({
      code: 'OBJECT_SESSION_MISMATCH',
      status: 400
    })
  })
})
