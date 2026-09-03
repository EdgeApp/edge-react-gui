/**
 * Ephemeral object handles.
 *
 * Core values with methods on them — a staged transaction, a swap quote, a
 * pending login — cannot cross JSON, so the engine keeps them and hands back
 * an id. These two calls read and release any of them, whatever kind it is.
 */
import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import { asObjectHandle, asOkObject } from '../schemas'

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
    'The handle fields, plus a `value` holding the live core object.'
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
      value: record.value
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
