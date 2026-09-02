import { requireBodyObject, type Router } from '../router'
import { getAccount, optionalNumber, requireString } from './helpers'

export function registerOtpRoutes(router: Router): void {
  /** account.otpKey and account.otpResetDate */
  router.add('GET', '/account/{sessionId}/otp-key', ctx => {
    const account = getAccount(ctx)
    return {
      otpKey: account.otpKey ?? null,
      otpResetDate: account.otpResetDate?.toISOString() ?? null
    }
  })

  /** account.enableOtp(timeout) */
  router.add('POST', '/account/{sessionId}/enable-otp', async ctx => {
    const body = requireBodyObject(ctx.body)
    const timeout = optionalNumber(body, 'timeout')
    const account = getAccount(ctx)
    await account.enableOtp(timeout)
    return { otpKey: account.otpKey ?? null }
  })

  /** account.disableOtp() */
  router.add('POST', '/account/{sessionId}/disable-otp', async ctx => {
    await getAccount(ctx).disableOtp()
    return undefined
  })

  /** account.cancelOtpReset() */
  router.add('POST', '/account/{sessionId}/cancel-otp-reset', async ctx => {
    await getAccount(ctx).cancelOtpReset()
    return undefined
  })

  /** account.repairOtp(otpKey) */
  router.add('POST', '/account/{sessionId}/repair-otp', async ctx => {
    const body = requireBodyObject(ctx.body)
    const otpKey = requireString(body, 'otpKey')
    await getAccount(ctx).repairOtp(otpKey)
    return undefined
  })
}
