import {
  asEither,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

import { doc } from '../doc'
import { route } from '../route'
import { getAccount } from './helpers'

const OTP_KEY_DOC = 'The 2FA secret itself. Secret material — record it safely.'

/**
 * Read the 2FA secret and reset state.
 *
 * @coreNote Also carries account.otpResetDate.
 */
export const otpKey = route({
  core: 'account.otpKey',
  method: 'GET',
  path: '/account/{sessionId}/otp-key',
  cli: 'otp-key',
  returns: asObject({
    otpKey: doc(
      asEither(asString, asValue(null)),
      'Null when 2FA is off. ' + OTP_KEY_DOC
    ),
    otpResetDate: doc(
      asEither(asString, asValue(null)),
      'Set once somebody has requested a reset; cancel it with `cancel-otp-reset`.'
    )
  }),

  handler(ctx) {
    const account = getAccount(ctx)
    return {
      otpKey: account.otpKey ?? null,
      otpResetDate: account.otpResetDate?.toISOString() ?? null
    }
  }
})

/**
 * Enable 2FA.
 *
 * Record the returned key before leaving the terminal: it is the only copy.
 */
export const enableOtp = route({
  core: 'account.enableOtp',
  method: 'POST',
  path: '/account/{sessionId}/enable-otp',
  cli: 'enable-otp',
  body: asObject({
    timeout: asOptional(
      doc(
        asNumber,
        'How long a reset request must wait before it completes. Core supplies the default when omitted.'
      )
    )
  }).withRest,
  returns: asObject({
    otpKey: doc(
      asEither(asString, asValue(null)),
      'The new secret. ' + OTP_KEY_DOC
    )
  }),

  async handler(ctx) {
    const account = getAccount(ctx)
    await account.enableOtp(ctx.body.timeout)
    return { otpKey: account.otpKey ?? null }
  }
})

/**
 * Disable 2FA.
 *
 * Logins stop requiring a code immediately.
 */
export const disableOtp = route({
  core: 'account.disableOtp',
  method: 'POST',
  path: '/account/{sessionId}/disable-otp',
  cli: 'disable-otp',

  async handler(ctx) {
    await getAccount(ctx).disableOtp()
    return undefined
  }
})

/**
 * Cancel a pending 2FA reset.
 *
 * The defence against somebody else requesting a reset on your account: as
 * long as you cancel before the timer runs out, their reset never lands.
 */
export const cancelOtpReset = route({
  core: 'account.cancelOtpReset',
  method: 'POST',
  path: '/account/{sessionId}/cancel-otp-reset',
  cli: 'cancel-otp-reset',

  async handler(ctx) {
    await getAccount(ctx).cancelOtpReset()
    return undefined
  }
})

/**
 * Re-point the account at a known 2FA secret.
 *
 * For a device whose stored secret has drifted from the server's.
 */
export const repairOtp = route({
  core: 'account.repairOtp',
  method: 'POST',
  path: '/account/{sessionId}/repair-otp',
  cli: 'repair-otp',
  body: asObject({
    otpKey: doc(asString, 'The secret the account should use.')
  }).withRest,
  errors: ['OTP_REQUIRED', 'BAD_REQUEST'],

  async handler(ctx) {
    await getAccount(ctx).repairOtp(ctx.body.otpKey)
    return undefined
  }
})
