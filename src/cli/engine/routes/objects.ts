/**
 * Ephemeral object handles.
 *
 * Core values with methods on them — a staged transaction, a swap quote, a
 * pending login, an edge-login lobby — cannot cross JSON, so the engine keeps
 * them and hands back an id.
 *
 * These two calls reach the session-scoped kinds only. A handle is owned by a
 * session when it is created with one, and of the four kinds only
 * `transaction` (`spend.ts`) and `swap` (`swap.ts`) are; `pendingLogin`
 * (`login.ts`) and `lobby` (`admin.ts`) are deliberately not, because they
 * exist before there is a session to own them. `requireOwnedHandle` refuses
 * an owner-less handle, so those two can only ever answer
 * `OBJECT_SESSION_MISMATCH` here and are read and released through their own
 * routes instead.
 */
import type { EdgeSwapQuote, EdgeTransaction } from 'edge-core-js'

import { doc } from '../doc'
import type { ObjectHandleKind } from '../objectHandles'
import { route } from '../route'
import { asInspectedHandle, asOkObject } from '../schemas'
import { requireOwnedHandle } from './helpers'

/**
 * A JSON-safe view of whatever a handle is holding.
 *
 * Only `transaction` holds a plain object. The others hold live core values
 * whose properties are getters: serializing an `EdgePendingEdgeLogin` walks
 * into `pending.account` once the login completes, and an `EdgeAccount`'s
 * `otpKey` and `recoveryKey` getters are ordinary enumerable properties on
 * the Node path the engine uses — `hideProperties` only applies to the fake
 * world and the React Native bridge. A swap quote reaches its wallets and
 * their whole `allTokens` map the same way. So each kind is projected to
 * scalars rather than handed to `JSON.stringify`.
 */
function projectHandleValue(kind: ObjectHandleKind, value: unknown): unknown {
  switch (kind) {
    case 'transaction':
      return value as EdgeTransaction

    case 'swap': {
      const quote = value as EdgeSwapQuote
      return {
        pluginId: quote.pluginId,
        fromNativeAmount: quote.fromNativeAmount,
        toNativeAmount: quote.toNativeAmount,
        expirationDate: quote.expirationDate ?? null,
        isEstimate: quote.isEstimate
      }
    }

    case 'pendingLogin':
    case 'lobby':
      // Unreachable: neither kind is created with a `sessionId`, so
      // `requireOwnedHandle` rejects them before this runs. A projection is
      // still needed wherever a pending login *is* serialised — see
      // `pendingSummary` in `login.ts`, which is that projection — because
      // handing an `EdgePendingEdgeLogin` to `JSON.stringify` walks into
      // `pending.account` and its `otpKey`/`recoveryKey` getters. Left as
      // explicit arms rather than a `default`, so adding a fifth kind is a
      // compile error here.
      return null
  }
}

/**
 * Inspect an object handle.
 *
 * For the session-scoped kinds: a staged transaction or a swap quote.
 *
 * @note Reading does not extend the TTL. Only a step that updates the value
 *   does.
 * @coreNote Engine handle store; core identifies these values by object
 *   reference.
 */
export const getObject = route({
  core: null,
  method: 'GET',
  path: '/account/{sessionId}/object',
  cli: { command: 'object-get', positional: 'objectId' },
  returns: doc(
    asInspectedHandle,
    'The handle fields, plus a `value` holding a JSON-safe view of the object. A staged transaction is returned whole; a swap quote is summarised, because the value behind it is a live core object whose properties are getters.'
  ),
  errors: [
    'OBJECT_NOT_FOUND',
    'OBJECT_EXPIRED',
    'OBJECT_IN_USE',
    'OBJECT_SESSION_MISMATCH'
  ],

  handler(ctx) {
    const record = requireOwnedHandle(ctx, ctx.params.objectId)
    return {
      ...ctx.state.objects.toInfo(record),
      value: projectHandleValue(record.kind, record.value)
    }
  }
})

/**
 * Release an object handle.
 *
 * Runs the handle's cleanup — closing a swap quote, discarding a staged
 * transaction — instead of waiting out the TTL.
 *
 * @coreNote Engine handle store.
 */
export const deleteObject = route({
  core: null,
  method: 'POST',
  path: '/account/{sessionId}/object/delete',
  cli: { command: 'object-delete', positional: 'objectId' },
  returns: asOkObject,
  errors: [
    'OBJECT_NOT_FOUND',
    'OBJECT_EXPIRED',
    'OBJECT_IN_USE',
    'OBJECT_SESSION_MISMATCH'
  ],

  async handler(ctx) {
    requireOwnedHandle(ctx, ctx.params.objectId)
    await ctx.state.objects.release(ctx.params.objectId)
    return { ok: true, objectId: ctx.params.objectId }
  }
})
