import { requireBodyObject, type Router } from '../router'
import { getAccount, optionalNumber, requireString } from './helpers'

export function registerOtpRoutes(router: Router): void {
  router.add('GET', '/v1/accounts/{sessionId}/otp', ctx => {
    const account = getAccount(ctx)
    return {
      enabled: account.otpKey != null,
      otpKey: account.otpKey ?? null,
      otpResetDate: account.otpResetDate?.toISOString() ?? null
    }
  })

  router.add('PUT', '/v1/accounts/{sessionId}/otp', async ctx => {
    const body = requireBodyObject(ctx.body)
    const timeout = optionalNumber(body, 'timeout')
    const account = getAccount(ctx)
    await account.enableOtp(timeout)
    return { otpKey: account.otpKey ?? null }
  })

  router.add('DELETE', '/v1/accounts/{sessionId}/otp', async ctx => {
    await getAccount(ctx).disableOtp()
    return undefined
  })

  router.add('DELETE', '/v1/accounts/{sessionId}/otp/reset', async ctx => {
    await getAccount(ctx).cancelOtpReset()
    return undefined
  })

  router.add('POST', '/v1/accounts/{sessionId}/otp/repair', async ctx => {
    const body = requireBodyObject(ctx.body)
    const otpKey = requireString(body, 'otpKey')
    await getAccount(ctx).repairOtp(otpKey)
    return undefined
  })
}
