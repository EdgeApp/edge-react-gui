import {
  asArray,
  asBoolean,
  asMaybe,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import { base64 } from 'rfc4648'

import { base58 } from '../../../util/encoding'
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
/**
 * The recovery-key body, which used to be a query.
 *
 * `recoveryKey` is a credential: with the answers it resets the account's
 * password, which is why `change-recovery` tells the user to keep it out of
 * band and why `EDGE_CLI_RECOVERY_KEY` exists. It was travelling in a URL —
 * the surface `redactUrl` strips values out of precisely because a query
 * string is written down by everything it passes through, and the one
 * `secretFlags.test.ts` claimed to be checking. `check-password-rules`,
 * `admin-repo-list` and `admin-repo-get` were moved to `POST` for this
 * reason and this route was missed.
 */
const asRecoveryQuestionsBody = asObject({
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
  cli: 'forget-account',
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
 * Normalize a username.
 *
 * Applies the same rules the login server does, so a caller can show the user
 * what their name will actually be before creating an account.
 */
export const fixUsername = route({
  core: 'context.fixUsername',
  method: 'GET',
  path: '/fix-username',
  cli: 'fix-username',
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
 * `POST` with the candidate in the body. A query string is the one place a
 * secret is written down by everything that touches it — the engine's own
 * log redacts query values for that reason — and a URL is what a proxy, a
 * crash report and a shell history keep. Nothing reads this route's result
 * from a cache, so the method costs nothing.
 *
 * @returns `EdgePasswordRules` from core: passed, tooShort, noNumber,
 *   noLowerCase, noUpperCase, secondsToCrack.
 */
export const checkPasswordRules = route({
  core: 'context.checkPasswordRules',
  method: 'POST',
  path: '/check-password-rules',
  cli: 'check-password-rules',
  body: asObject({
    password: doc(asString, 'The candidate password to score.')
  }).withRest,
  returns: asCoreValue,

  handler(ctx) {
    return ctx.state.core.context.checkPasswordRules(ctx.body.password)
  }
})

/**
 * A base64 string as bytes, or nothing.
 *
 * `base64.parse` throws for a string that is not base64, and core's own
 * `loginId` always is — but a stash this version cannot read should be
 * listed rather than failing the whole call for its sake.
 */
const asBase64Bytes = (raw: unknown): Uint8Array => base64.parse(String(raw))

/**
 * Fetch login-server messages for every local user.
 *
 * @returns An `EdgeLoginMessage[]` from core, one entry per local login, each
 *   carrying its own `loginId`, `otpResetPending`, `pendingVouchers`,
 *   `recovery2Corrupt` and, where the stash has one, `username`.
 * @note `loginId` is re-encoded to base58. Core answers this one in base64
 *   while every other login id in the API — `local-users`, a login's
 *   `rootLoginId`, what `forget-account` and `login-with-key
 *   --use-login-id` take — is base58, and this route is the documented way
 *   to find which local account has a pending voucher or an OTP reset. So
 *   the natural next step was to act on the id it named, which failed with
 *   `404 USER_NOT_FOUND` while `local-users` listed the same account under
 *   the other spelling.
 */
export const fetchLoginMessages = route({
  core: 'context.fetchLoginMessages',
  method: 'GET',
  path: '/fetch-login-messages',
  cli: 'fetch-login-messages',
  returns: doc(
    asCoreValue,
    // Core returns an *array*, with `loginId` as a field on each entry. The
    // published shape said a map keyed by loginId, so a generated client was
    // told to read `body[loginId].otpResetPending` — which is undefined.
    // Nothing failed at runtime, because the handler passes core's value
    // through under `asCoreValue`.
    'An `EdgeLoginMessage[]` from core: one entry per local login, each with its own `loginId`, `otpResetPending`, `pendingVouchers`, `recovery2Corrupt` and, where the stash has one, `username`. `loginId` is base58, like every other login id in this API \u2014 core answers it in base64 here, and an id in the wrong alphabet is one `forget-account` and `--use-login-id` reject.'
  ),
  errors: ['NETWORK_ERROR'],

  async handler(ctx) {
    const messages = await ctx.state.core.context.fetchLoginMessages()
    // Re-encoded, not passed through: see the note above. `asMaybe`, because
    // a stash this version cannot read should still be listed rather than
    // failing the whole call for its sake.
    return messages.map(message => {
      const bytes = asMaybe(asBase64Bytes)(message.loginId)
      return bytes == null
        ? message
        : { ...message, loginId: base58.stringify(bytes) }
    })
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
  cli: 'request-otp-reset',
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
 * @note `USERNAME_ERROR` here means "no recovery is set up for this
 *   `username`/`recoveryKey` pair", which the login server reports with the
 *   message `Account does not exist on server` — so an account that plainly
 *   does exist, and that the same engine may be logged into, is refused with
 *   prose that reads as though the username were wrong. Check
 *   `account-info`'s `recoveryKey` before acting on it: `null` there means
 *   the account has no recovery questions and this call cannot succeed
 *   whatever key is sent.
 * @coreNote Our surface drops the `2` from the path, command and `recoveryKey`
 *   parameter; a future Recovery1 would be suffixed `V1`.
 */
export const fetchRecoveryQuestions = route({
  core: 'context.fetchRecovery2Questions',
  coreExtra: {
    recoveryKey: 'Core calls it recovery2Key. The `2` is dropped throughout.'
  },
  method: 'POST',
  path: '/fetch-recovery-questions',
  cli: 'fetch-recovery-questions',
  body: asRecoveryQuestionsBody,
  returns: asObject({
    questions: doc(
      asArray(asString),
      'The questions in the order `login-with-recovery` expects the answers.'
    )
  }),
  errors: ['USERNAME_ERROR', 'NETWORK_ERROR'],

  async handler(ctx) {
    const { recoveryKey, username } = ctx.body
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
