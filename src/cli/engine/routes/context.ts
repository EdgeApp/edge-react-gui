import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'

import { doc } from '../doc'
import { route } from '../route'
import { asCoreValue } from '../schemas'

const asUsernameQuery = asObject({
  username: doc(asString, 'The name to check.'),
  challengeId: asOptional(
    doc(asString, 'Supply after solving a CAPTCHA to retry the same check.')
  )
}).withRest

/**
 * List local users on this device.
 *
 * @returns Everything `context.localUsers` reports, including which login
 *   methods each user has enabled on this device.
 */
export const localUsers = route({
  core: 'context.localUsers',
  method: 'GET',
  path: '/local-users',
  cli: 'local-users',
  returns: asObject({
    localUsers: doc(
      asArray(asCoreValue),
      '`EdgeUserInfo[]`: one entry per account cached on this device.'
    )
  }),

  handler(ctx) {
    return { localUsers: ctx.state.core.context.localUsers }
  }
})

/**
 * Check whether a username is free.
 *
 */
export const usernameAvailable = route({
  core: 'context.usernameAvailable',
  method: 'GET',
  path: '/username-available',
  cli: 'username-available',
  query: asUsernameQuery,
  returns: asObject({
    username: doc(asString, 'The name that was checked, echoed back.'),
    available: doc(
      asBoolean,
      'True when nobody holds this name. It is not reserved by asking.'
    )
  }),
  errors: ['USERNAME_ERROR', 'CHALLENGE_REQUIRED', 'NETWORK_ERROR'],

  async handler(ctx) {
    const { username, challengeId } = ctx.query.valid
    const available = await ctx.state.core.context.usernameAvailable(username, {
      challengeId
    })
    return { username, available }
  }
})

/**
 * Fetch login-server messages for every local user.
 *
 * @returns `EdgeLoginMessages` from core, keyed by loginId; each value carries
 *   otpResetPending and pendingVouchers. Passed straight through.
 */
export const fetchLoginMessages = route({
  core: 'context.fetchLoginMessages',
  method: 'GET',
  path: '/fetch-login-messages',
  cli: 'fetch-login-messages',
  returns: doc(
    asCoreValue,
    '`EdgeLoginMessages` from core, keyed by loginId; each value carries otpResetPending and pendingVouchers.'
  ),
  errors: ['NETWORK_ERROR'],

  async handler(ctx) {
    return await ctx.state.core.context.fetchLoginMessages()
  }
})
