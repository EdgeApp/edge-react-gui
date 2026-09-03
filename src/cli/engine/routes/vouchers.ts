import { asArray, asObject, asString } from 'cleaners'

import { doc } from '../doc'
import { route } from '../route'
import { asCoreValue } from '../schemas'
import { getAccount } from './helpers'

const VOUCHER_ID_DOC =
  'From `pending-vouchers`, or an `OTP_REQUIRED` error’s `details.voucherId`.'

const asVoucherBody = asObject({
  voucherId: doc(asString, VOUCHER_ID_DOC)
}).withRest

/**
 * List pending 2FA vouchers.
 *
 * When 2FA blocks a login, the login server issues a voucher that an
 * already-trusted device can approve or reject.
 */
export const pendingVouchers = route({
  core: 'account.pendingVouchers',
  method: 'GET',
  path: '/account/{sessionId}/pending-vouchers',
  cli: 'pending-vouchers',
  returns: asObject({
    pendingVouchers: doc(
      asArray(asCoreValue),
      '`EdgePendingVoucher[]`: voucherId, activates, created, deviceDescription, ipDescription.'
    )
  }),

  handler(ctx) {
    // Core leaves this undefined until the login server has reported on it,
    // and the documented type is an array either way.
    return { pendingVouchers: getAccount(ctx).pendingVouchers ?? [] }
  }
})

/**
 * Approve a voucher.
 *
 * Lets the waiting device finish logging in.
 */
export const approveVoucher = route({
  core: 'account.approveVoucher',
  method: 'POST',
  path: '/account/{sessionId}/approve-voucher',
  cli: 'approve-voucher',
  body: asVoucherBody,
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    await getAccount(ctx).approveVoucher(ctx.body.voucherId)
    return undefined
  }
})

/**
 * Reject a voucher.
 *
 * Denies the waiting device. The login it was issued for cannot complete.
 */
export const rejectVoucher = route({
  core: 'account.rejectVoucher',
  method: 'POST',
  path: '/account/{sessionId}/reject-voucher',
  cli: 'reject-voucher',
  body: asVoucherBody,
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    await getAccount(ctx).rejectVoucher(ctx.body.voucherId)
    return undefined
  }
})
