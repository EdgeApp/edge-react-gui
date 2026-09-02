import { requireBodyObject, type Router } from '../router'
import { getAccount, requireString } from './helpers'

export function registerVoucherRoutes(router: Router): void {
  /** account.pendingVouchers */
  router.add('GET', '/accounts/{sessionId}/pending-vouchers', ctx => {
    return { pendingVouchers: getAccount(ctx).pendingVouchers }
  })

  /** account.approveVoucher(voucherId) */
  router.add('POST', '/accounts/{sessionId}/approve-voucher', async ctx => {
    const body = requireBodyObject(ctx.body)
    const voucherId = requireString(body, 'voucherId')
    await getAccount(ctx).approveVoucher(voucherId)
    return undefined
  })

  /** account.rejectVoucher(voucherId) */
  router.add('POST', '/accounts/{sessionId}/reject-voucher', async ctx => {
    const body = requireBodyObject(ctx.body)
    const voucherId = requireString(body, 'voucherId')
    await getAccount(ctx).rejectVoucher(voucherId)
    return undefined
  })
}
