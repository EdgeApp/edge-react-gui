import type { Router } from '../router'
import { getAccount } from './helpers'

export function registerVoucherRoutes(router: Router): void {
  router.add('GET', '/v1/accounts/{sessionId}/vouchers', ctx => {
    return getAccount(ctx).pendingVouchers
  })

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/vouchers/{voucherId}/approve',
    async ctx => {
      await getAccount(ctx).approveVoucher(ctx.params.voucherId)
      return undefined
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/vouchers/{voucherId}/reject',
    async ctx => {
      await getAccount(ctx).rejectVoucher(ctx.params.voucherId)
      return undefined
    }
  )
}
