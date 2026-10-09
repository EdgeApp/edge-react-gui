import { describe, expect, it } from '@jest/globals'

import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import type { RouteContext } from '../../cli/engine/router'
import { requireOwnedHandle } from '../../cli/engine/routes/helpers'
import { deleteObject, getObject } from '../../cli/engine/routes/objects'
import { thrownSync } from '../../util/fake/thrownEngineError'

/** The error shape `engineError` produces. */
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
  ): Error & { code: string; status: number } => {
    const error = new Error(message) as Error & { code: string; status: number }
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
      thrownSync(() => requireOwnedHandle(ctx, objectId, 'transaction'))
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
    expect(thrownSync(() => requireOwnedHandle(ctx, objectId))).toStrictEqual({
      code: 'INVALID_SESSION',
      status: 401
    })
  })

  it('reports the mismatch ahead of the kind', () => {
    const objects = new ObjectHandleStore()
    const { objectId } = objects.create({
      kind: 'swap',
      prefix: 'swap_',
      value: {},
      sessionId: 'other'
    })

    // `get` applied the kind, expiry and in-use checks first, so asking for
    // the wrong kind told A that B's id exists and is not a transaction.
    // Ownership is the authorisation step; nothing about another session's
    // handle is A's to learn.
    const ctx = makeCtx({ objects, sessionId: 'live', liveSessionId: 'live' })
    expect(
      thrownSync(() => requireOwnedHandle(ctx, objectId, 'transaction'))
    ).toStrictEqual({
      code: 'OBJECT_SESSION_MISMATCH',
      status: 400
    })
  })

  it('does not release another session’s expired handle', () => {
    const objects = new ObjectHandleStore()
    let closed = false
    const { objectId } = objects.create({
      kind: 'swap',
      prefix: 'swap_',
      value: {},
      sessionId: 'other',
      ttlMs: -1,
      onExpire: () => {
        closed = true
      }
    })

    // The expiry branch of `get` does not only report: it calls `delete`,
    // which runs `onExpire` — for a swap that is `quote.close()` at the
    // exchange. Reached before the ownership check, one session could close
    // another's quote by guessing its id.
    const ctx = makeCtx({ objects, sessionId: 'live', liveSessionId: 'live' })
    expect(thrownSync(() => requireOwnedHandle(ctx, objectId))).toStrictEqual({
      code: 'OBJECT_SESSION_MISMATCH',
      status: 400
    })
    expect(closed).toBe(false)
  })

  it('leaves `OBJECT_NOT_FOUND` to the handle store', () => {
    // `peekOwner` says nothing about a missing handle, so there is one place
    // that decides what an unknown id answers.
    const ctx = makeCtx({
      objects: new ObjectHandleStore(),
      sessionId: 'live',
      liveSessionId: 'live'
    })
    expect(thrownSync(() => requireOwnedHandle(ctx, 'tx_nope'))).toStrictEqual({
      code: 'OBJECT_NOT_FOUND',
      status: 404
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
      thrownSync(() => requireOwnedHandle(ctx, objectId, 'transaction'))
    ).toStrictEqual({
      code: 'OBJECT_SESSION_MISMATCH',
      status: 400
    })
  })
})

/**
 * The two handle routes, which `REFUSAL_ONLY` excused with this suite.
 *
 * The excuse was not true: this file covered `requireOwnedHandle` and the
 * handle store, and `routes/objects.ts` itself ran at 0% of branches. The
 * projection is the part worth holding — a swap quote is a live core value
 * whose properties are getters, so handing it to `JSON.stringify` walks into
 * its wallets and their whole `allTokens` map, and the five scalars are the
 * only thing keeping the response small.
 */
/**
 * A route's handler takes the typed context its declaration derives, whose
 * `query` carries a phantom field no hand-built object can satisfy. Same
 * shape as `spendHandlers.test.ts`'s `makeCtx`, which returns `any`.
 */
const handlerOf = (declared: {
  handler: (ctx: never) => unknown
}): ((ctx: RouteContext) => unknown) =>
  declared.handler as unknown as (ctx: RouteContext) => unknown

describe('object-get and object-delete', () => {
  it('returns a staged transaction whole', async () => {
    const objects = new ObjectHandleStore()
    const tx = { txid: 'a', nativeAmount: '-1000', metadata: { name: 'x' } }
    const { objectId } = objects.create({
      kind: 'transaction',
      prefix: 'tx_',
      value: tx,
      sessionId: 'live'
    })
    const ctx = makeCtx({ objects, sessionId: 'live', liveSessionId: 'live' })
    ctx.params.objectId = objectId

    const answer = (await handlerOf(getObject)(ctx)) as {
      kind: string
      value: unknown
    }
    expect(answer.kind).toBe('transaction')
    expect(answer.value).toStrictEqual(tx)
  })

  it('summarises a swap quote rather than serialising it', async () => {
    const objects = new ObjectHandleStore()
    // A quote shaped the way core's is: five scalars this engine publishes,
    // and a getter that must not be walked into.
    let walked = 0
    const quote = {
      pluginId: 'changenow',
      fromNativeAmount: '1000',
      toNativeAmount: '2000',
      expirationDate: undefined,
      isEstimate: true,
      get fromWallet(): unknown {
        ++walked
        return { allTokens: {} }
      }
    }
    const { objectId } = objects.create({
      kind: 'swap',
      prefix: 'swap_',
      value: quote,
      sessionId: 'live'
    })
    const ctx = makeCtx({ objects, sessionId: 'live', liveSessionId: 'live' })
    ctx.params.objectId = objectId

    const answer = (await handlerOf(getObject)(ctx)) as { value: unknown }
    expect(answer.value).toStrictEqual({
      pluginId: 'changenow',
      fromNativeAmount: '1000',
      toNativeAmount: '2000',
      // `?? null`, so an absent expiry is publishable JSON rather than a
      // field that vanishes.
      expirationDate: null,
      isEstimate: true
    })
    expect(walked).toBe(0)
  })

  it('releases the handle it was given', async () => {
    const objects = new ObjectHandleStore()
    const { objectId } = objects.create({
      kind: 'transaction',
      prefix: 'tx_',
      value: { txid: 'a' },
      sessionId: 'live'
    })
    const ctx = makeCtx({ objects, sessionId: 'live', liveSessionId: 'live' })
    ctx.params.objectId = objectId

    expect(await handlerOf(deleteObject)(ctx)).toStrictEqual({
      ok: true,
      objectId
    })
    // Gone, so a second call is the 404 and not a second release.
    expect(thrownSync(() => requireOwnedHandle(ctx, objectId))).toStrictEqual({
      code: 'OBJECT_NOT_FOUND',
      status: 404
    })
  })
})
