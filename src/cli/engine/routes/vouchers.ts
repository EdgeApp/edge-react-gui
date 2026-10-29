import { asArray, asObject, asString } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'

import { readRequestBudgetMs, requestBudgetFor } from '../../requestBudget'
import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import type { RouteContext } from '../router'
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
 * a hit costs no round trip. Core leaves it undefined until the login server
 * has reported, which is the one case this cannot judge: an undefined list
 * is not an empty one, so the call goes through as before rather than
 * refusing a voucher that may well exist.
 *
 * Core refreshes the list only on the account's login sync, every 30
 * seconds, and the ordinary flow is to act on a voucher right after another
 * device hit `OTP_REQUIRED` — inside that window. So a miss waits for the
 * list to change, up to one sync interval, before refusing, and the refusal
 * says the list may be up to that old rather than that no login is waiting.
 */
async function assertPendingVoucher(
  account: Pick<EdgeAccount, 'pendingVouchers' | 'watch'>,
  voucherId: string,
  waitMs: number
): Promise<void> {
  const listed = (): boolean | undefined => {
    const pending = account.pendingVouchers
    if (pending == null) return undefined
    return pending.some(voucher => voucher.voucherId === voucherId)
  }
  if (listed() !== false) return
  if (waitMs > 0) {
    const found = await new Promise<boolean>(resolve => {
      const timer = setTimeout(() => {
        unwatch()
        resolve(false)
      }, waitMs)
      // Called as a method: core's account is a yaob object, and `watch`
      // taken off it loses its `this`.
      const unwatch = account.watch('pendingVouchers', () => {
        if (listed() === false) return
        clearTimeout(timer)
        unwatch()
        resolve(true)
      })
    })
    if (found) return
  }
  // What the wait really covered: a short `--timeout` leaves less than a
  // sync interval, or none, and the message should not claim otherwise.
  const asOf =
    waitMs >= VOUCHER_SYNC_WAIT_MS
      ? 'as of its last login sync, which core runs every 30 seconds and ' +
        'this call waited for'
      : `as of its last login sync, which core runs every 30 seconds; this ` +
        `call waited ${Math.round(waitMs / 1000)} s, and a --timeout of ` +
        `${TIMEOUT_FOR_FULL_WAIT_S} s or more waits for one`
  throw engineError(
    'NOT_FOUND',
    account.pendingVouchers?.length === 0
      ? `No voucher "${voucherId}" is pending on this account, and none is, ` +
          `${asOf}: a voucher exists only while a login is waiting on 2FA.`
      : `No voucher "${voucherId}" is pending on this account ${asOf}. ` +
          '`pending-vouchers` lists the ones that are.',
    404,
    { voucherId }
  )
}

/** One login-sync interval and a little more: core's `SYNC_INTERVAL` is 30s. */
const VOUCHER_SYNC_WAIT_MS = 35_000

/** Left for the answer to travel back once the wait gives up. */
const REPLY_MARGIN_MS = 1000

/**
 * The smallest whole-second `--timeout` whose budget still covers a full
 * wait: what the client sends (`requestBudgetFor`) less the reply margin,
 * and a second for what the request spends before it starts waiting.
 * Derived, because a hand-written figure said 37 s, which the client's own
 * headroom and this margin turn into a 34 s wait.
 */
export const TIMEOUT_FOR_FULL_WAIT_S = ((): number => {
  let seconds = Math.ceil(VOUCHER_SYNC_WAIT_MS / 1000)
  while (
    requestBudgetFor(seconds * 1000) - REPLY_MARGIN_MS <
    VOUCHER_SYNC_WAIT_MS + 1000
  ) {
    ++seconds
  }
  return seconds
})()

/**
 * How long a miss waits: one sync interval, but never past the caller's
 * own budget, so a short `--timeout` still gets the `NOT_FOUND` rather than
 * a client timeout. A second is left for the answer to travel back.
 */
function voucherWaitMs(ctx: RouteContext): number {
  const budget = readRequestBudgetMs(ctx.req, ctx.arrivedAt)
  return budget == null
    ? VOUCHER_SYNC_WAIT_MS
    : Math.max(0, Math.min(VOUCHER_SYNC_WAIT_MS, budget - REPLY_MARGIN_MS))
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
    await assertPendingVoucher(account, ctx.body.voucherId, voucherWaitMs(ctx))
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
    await assertPendingVoucher(account, ctx.body.voucherId, voucherWaitMs(ctx))
    await account.rejectVoucher(ctx.body.voucherId)
    return undefined
  }
})
