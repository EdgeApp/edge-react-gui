/**
 * Ephemeral object handles.
 *
 * Core values with methods on them — a staged transaction, a swap quote, a
 * pending login — cannot cross JSON, so the engine keeps them and hands back
 * an id. These two calls read and release any of them, whatever kind it is.
 */
import type { EdgeSwapQuote, EdgeTransaction } from 'edge-core-js'

import { doc } from '../doc'
import { engineError } from '../errors'
import type { ObjectHandleKind } from '../objectHandles'
import { route } from '../route'
import { asObjectHandle, asOkObject } from '../schemas'

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

    case 'pendingLogin': {
      const record = value as {
        pending?: { id?: string; state?: string; username?: string }
        cancelled?: boolean
        error?: string
      }
      return {
        lobbyId: record.pending?.id ?? null,
        state: record.pending?.state ?? null,
        username: record.pending?.username ?? null,
        cancelled: record.cancelled === true,
        error: record.error ?? null
      }
    }

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

    case 'lobby':
      // Nothing scalar worth reporting, and the value is a live lobby.
      return null
  }
}

/**
 * Inspect an object handle.
 *
 * Works for every kind: transactions, pending logins, swap quotes.
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
    asObjectHandle,
    'The handle fields, plus a `value` holding a JSON-safe view of the object. A staged transaction is returned whole; pending logins and swap quotes are summarised, because the values behind them are live core objects.'
  ),
  errors: ['OBJECT_NOT_FOUND', 'OBJECT_EXPIRED', 'OBJECT_SESSION_MISMATCH'],

  handler(ctx) {
    const record = ctx.state.objects.get(ctx.params.objectId)
    if (record.sessionId != null && record.sessionId !== ctx.params.sessionId) {
      throw engineError(
        'OBJECT_SESSION_MISMATCH',
        `objectId belongs to a different session`,
        400
      )
    }
    return {
      ...ctx.state.objects.toInfo(record),
      value: projectHandleValue(record.kind, record.value)
    }
  }
})

/**
 * Release an object handle.
 *
 * Runs the handle's cleanup — closing a swap quote, cancelling a pending
 * login — instead of waiting out the TTL.
 *
 * @coreNote Engine handle store.
 */
export const deleteObject = route({
  core: null,
  method: 'POST',
  path: '/account/{sessionId}/object/delete',
  cli: { command: 'object-delete', positional: 'objectId' },
  returns: asOkObject,
  errors: ['OBJECT_NOT_FOUND', 'OBJECT_EXPIRED', 'OBJECT_SESSION_MISMATCH'],

  async handler(ctx) {
    const record = ctx.state.objects.get(ctx.params.objectId)
    if (record.sessionId != null && record.sessionId !== ctx.params.sessionId) {
      throw engineError(
        'OBJECT_SESSION_MISMATCH',
        `objectId belongs to a different session`,
        400
      )
    }
    await ctx.state.objects.delete(ctx.params.objectId)
    return { ok: true, objectId: ctx.params.objectId }
  }
})
