import { asArray, asObject, asString } from 'cleaners'

import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import { asCoreValue } from '../schemas'
import { getAccount } from './helpers'

const VOUCHER_ID_DOC =
  'From `pending-vouchers`, or an `OTP_REQUIRED` error’s `details.voucherId`.'

const asVoucherBody = asObject({
  voucherId: doc(asString, VOUCHER_ID_DOC)
}).withRest

/**
 * Refuse an id that is not on the account's own pending list.
 *
 * Core forwards whatever it is given to the login server and both calls
 * answered `{"ok": true}` for an arbitrary string, on an account whose
 * `pendingVouchers` is empty — the same silent-wrong-answer shape this
 * branch removed from `change-enabled-token-ids` and from `balance-map
 * --token-id`, and the one place it matters most. A voucher is a pending
 * login the login server *approves on a timer* unless it is rejected, so a
 * caller who mistypes an id, or passes one from a stale `OTP_REQUIRED`, was
 * told an unrecognised device had been denied while that device's login went
 * on to succeed.
 *
 * `account.pendingVouchers` is the list `pending-vouchers` already reads, so
 * this costs no round trip. Core leaves it undefined until the login server
 * has reported, which is the one case this cannot judge: an undefined list
 * is not an empty one, so the call goes through as before rather than
 * refusing a voucher that may well exist.
 */
function assertPendingVoucher(
  account: { pendingVouchers?: Array<{ voucherId: string }> },
  voucherId: string
): void {
  const pending = account.pendingVouchers
  if (pending == null) return
  if (pending.some(voucher => voucher.voucherId === voucherId)) return
  throw engineError(
    'NOT_FOUND',
    pending.length === 0
      ? `No voucher "${voucherId}" is pending on this account, and none is: ` +
          'a voucher exists only while a login is waiting on 2FA.'
      : `No voucher "${voucherId}" is pending on this account. ` +
          '`pending-vouchers` lists the ones that are.',
    404,
    { voucherId }
  )
}

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
  errors: ['BAD_REQUEST', 'NOT_FOUND', 'NETWORK_ERROR'],

  async handler(ctx) {
    const account = getAccount(ctx)
    assertPendingVoucher(account, ctx.body.voucherId)
    await account.approveVoucher(ctx.body.voucherId)
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
  errors: ['BAD_REQUEST', 'NOT_FOUND', 'NETWORK_ERROR'],

  async handler(ctx) {
    const account = getAccount(ctx)
    assertPendingVoucher(account, ctx.body.voucherId)
    await account.rejectVoucher(ctx.body.voucherId)
    return undefined
  }
})
