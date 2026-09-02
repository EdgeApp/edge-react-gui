import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'

import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import { asCoreValue } from '../schemas'

const asUsernameQuery = asObject({
  username: doc(asString, 'The name to check.'),
  challengeId: asOptional(
    doc(asString, 'Supply after solving a CAPTCHA to retry the same check.')
  )
}).withRest

const asForgetAccountBody = asObject({
  rootLoginId: doc(
    asString,
    'Core takes a `rootLoginId`. A username is also accepted and resolved against `localUsers` first, so callers need not hash it.'
  )
}).withRest
const asOtpResetBody = asObject({
  username: doc(asString, 'Whose 2FA to reset.'),
  otpResetToken: doc(
    asString,
    'From `details.resetToken` on an `OTP_REQUIRED` error.'
  )
}).withRest
const asRecoveryQuestionsQuery = asObject({
  recoveryKey: doc(
    asString,
    'From `change-recovery`, stored by the user out of band.'
  ),
  username: doc(asString, 'Whose questions to fetch.')
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
 * Forget an account on this device.
 *
 * Removes locally cached credentials. The remote account is untouched.
 *
 */
export const forgetAccount = route({
  core: 'context.forgetAccount',
  method: 'POST',
  path: '/forget-account',
  cli: { command: 'forget-account', positional: 'rootLoginId' },
  body: asForgetAccountBody,
  errors: ['USER_NOT_FOUND', 'BAD_REQUEST'],

  async handler(ctx) {
    const { rootLoginId } = ctx.body
    const { context } = ctx.state.core
    const found = context.localUsers.find(
      user => user.loginId === rootLoginId || user.username === rootLoginId
    )
    if (found == null) {
      throw engineError(
        'USER_NOT_FOUND',
        `No local user matching: ${rootLoginId}`,
        404
      )
    }
    await context.forgetAccount(found.loginId)
    return undefined
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
  cli: { command: 'username-available', positional: 'username' },
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
 * Normalize a username.
 *
 * Applies the same rules the login server does, so a caller can show the user
 * what their name will actually be before creating an account.
 */
export const fixUsername = route({
  core: 'context.fixUsername',
  method: 'GET',
  path: '/fix-username',
  cli: { command: 'fix-username', positional: 'username' },
  query: asObject({
    username: doc(asString, 'The name to normalize.')
  }).withRest,
  returns: asObject({
    username: doc(asString, 'The normalized value. The input is not echoed.')
  }),

  handler(ctx) {
    return {
      username: ctx.state.core.context.fixUsername(ctx.query.valid.username)
    }
  }
})

/**
 * Score a candidate password.
 *
 * @note Send it with `curl --get --data-urlencode` rather than putting it in a
 *   shell-visible URL.
 * @returns `EdgePasswordRules` from core: passed, tooShort, noNumber,
 *   noLowerCase, noUpperCase, secondsToCrack.
 */
export const checkPasswordRules = route({
  core: 'context.checkPasswordRules',
  method: 'GET',
  path: '/check-password-rules',
  cli: 'check-password-rules',
  query: asObject({
    password: doc(asString, 'The candidate password to score.')
  }).withRest,
  returns: asCoreValue,

  handler(ctx) {
    return ctx.state.core.context.checkPasswordRules(ctx.query.valid.password)
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

/**
 * Request a 2FA reset.
 *
 * Starts the timed reset a user falls back on after losing their
 * authenticator.
 *
 * @returns When the reset completes if nobody cancels it.
 */
export const requestOtpReset = route({
  core: 'context.requestOtpReset',
  method: 'POST',
  path: '/request-otp-reset',
  cli: { command: 'request-otp-reset', positional: 'username' },
  body: asOtpResetBody,
  returns: asObject({
    resetDate: doc(
      asString,
      'When 2FA will actually come off. The login server enforces a waiting ' +
        'period so the real owner has time to cancel.'
    )
  }),
  errors: ['USERNAME_ERROR', 'BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const resetDate = await ctx.state.core.context.requestOtpReset(
      ctx.body.username,
      ctx.body.otpResetToken
    )
    return { resetDate: resetDate.toISOString() }
  }
})

/**
 * Fetch a user’s recovery questions.
 *
 * @coreNote Our surface drops the `2` from the path, command and `recoveryKey`
 *   parameter; a future Recovery1 would be suffixed `V1`.
 */
export const fetchRecoveryQuestions = route({
  core: 'context.fetchRecovery2Questions',
  method: 'GET',
  path: '/fetch-recovery-questions',
  cli: { command: 'fetch-recovery-questions', positional: 'username' },
  query: asRecoveryQuestionsQuery,
  returns: asObject({
    questions: doc(
      asArray(asString),
      'The questions in the order `login-with-recovery` expects the answers.'
    )
  }),
  errors: ['USERNAME_ERROR', 'NETWORK_ERROR'],

  async handler(ctx) {
    const { recoveryKey, username } = ctx.query.valid
    const questions = await ctx.state.core.context.fetchRecovery2Questions(
      recoveryKey,
      username
    )
    return { questions }
  }
})

/**
 * Pre-fetch a CAPTCHA challenge.
 *
 * Lets a client solve a challenge before it hits `403 CHALLENGE_REQUIRED`
 * mid-flow.
 *
 * @returns `challengeUri` is absent when the server considers the challenge
 *   already satisfied.
 */
export const fetchChallenge = route({
  core: 'context.fetchChallenge',
  method: 'POST',
  path: '/fetch-challenge',
  cli: 'fetch-challenge',
  body: asObject({}).withRest,
  returns: asObject({
    challengeId: doc(
      asString,
      'Pass to the call that demanded a challenge once the user has solved it.'
    ),
    challengeUri: doc(
      asOptional(asString),
      'Where to send the user to solve the CAPTCHA. Absent when the server ' +
        'issued a challenge that needs no interaction.'
    )
  }),
  errors: ['NETWORK_ERROR'],

  async handler(ctx) {
    return await ctx.state.core.context.fetchChallenge()
  }
})

/**
 * List plugin ids usable for wallet creation.
 *
 * Currency and accountbased plugins only — swap plugins are excluded.
 *
 * @coreNote Engine view of the enabled plugin set; core exposes
 *   `account.currencyConfig` per plugin instead.
 */
export const currencyConfigs = route({
  core: null,
  method: 'GET',
  path: '/currency-configs',
  cli: 'currency-configs',
  returns: asObject({
    pluginIds: doc(asArray(asString), 'Currency plugins this engine loaded.')
  }),

  handler(ctx) {
    return { pluginIds: ctx.state.core.currencyPluginIds }
  }
})
