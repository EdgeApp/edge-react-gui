import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'

import { engineError } from '../errors'
import { route } from '../route'
import { asCoreValue } from '../schemas'

const asUsernameQuery = asObject({
  username: asString,
  challengeId: asOptional(asString)
}).withRest

const asForgetAccountBody = asObject({ rootLoginId: asString }).withRest
const asOtpResetBody = asObject({
  username: asString,
  otpResetToken: asString
}).withRest
const asRecoveryQuestionsQuery = asObject({
  recoveryKey: asString,
  username: asString
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
  returns: asObject({ localUsers: asArray(asCoreValue) }),

  handler(ctx) {
    return { localUsers: ctx.state.core.context.localUsers }
  }
})

/**
 * Forget an account on this device.
 *
 * Removes locally cached credentials. The remote account is untouched.
 *
 * @param rootLoginId Core takes a `rootLoginId`. A username is also accepted
 *   and resolved against `localUsers` first, so callers need not hash it.
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
 * @param username The name to check.
 * @param challengeId Supply after solving a CAPTCHA to retry the same check.
 */
export const usernameAvailable = route({
  core: 'context.usernameAvailable',
  method: 'GET',
  path: '/username-available',
  cli: { command: 'username-available', positional: 'username' },
  query: asUsernameQuery,
  returns: asObject({ username: asString, available: asBoolean }),
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
 * @param username The name to normalize.
 * @returns The normalized value under `username`; the input is not echoed.
 */
export const fixUsername = route({
  core: 'context.fixUsername',
  method: 'GET',
  path: '/fix-username',
  cli: { command: 'fix-username', positional: 'username' },
  query: asObject({ username: asString }).withRest,
  returns: asObject({ username: asString }),

  handler(ctx) {
    return {
      username: ctx.state.core.context.fixUsername(ctx.query.valid.username)
    }
  }
})

/**
 * Score a candidate password.
 *
 * @param password The candidate.
 * @note Send it with `curl --get --data-urlencode` rather than putting it in a
 *   shell-visible URL.
 * @returns `EdgePasswordRules` from core: passed, tooShort, noNumber,
 *   noLowerCase, noUpperCase, secondsToCrack.
 */
export const checkPasswordRules = route({
  core: 'context.checkPasswordRules',
  method: 'GET',
  path: '/check-password-rules',
  cli: { command: 'check-password-rules', positional: 'password' },
  query: asObject({ password: asString }).withRest,
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
  returns: asCoreValue,
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
 * @param username Whose 2FA to reset.
 * @param otpResetToken From `details.resetToken` on an `OTP_REQUIRED` error.
 * @returns When the reset completes if nobody cancels it.
 */
export const requestOtpReset = route({
  core: 'context.requestOtpReset',
  method: 'POST',
  path: '/request-otp-reset',
  cli: { command: 'request-otp-reset', positional: 'username' },
  body: asOtpResetBody,
  returns: asObject({ resetDate: asString }),
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
 * @param recoveryKey From `change-recovery`, stored by the user out of band.
 * @param username Whose questions to fetch.
 * @coreNote Our surface drops the `2` from the path, command and `recoveryKey`
 *   parameter; a future Recovery1 would be suffixed `V1`.
 */
export const fetchRecoveryQuestions = route({
  core: 'context.fetchRecovery2Questions',
  method: 'GET',
  path: '/fetch-recovery-questions',
  cli: { command: 'fetch-recovery-questions', positional: 'username' },
  query: asRecoveryQuestionsQuery,
  returns: asObject({ questions: asArray(asString) }),
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
    challengeId: asString,
    challengeUri: asOptional(asString)
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
  returns: asObject({ pluginIds: asArray(asString) }),

  handler(ctx) {
    return { pluginIds: ctx.state.core.currencyPluginIds }
  }
})
