import { describe, expect, it, jest } from '@jest/globals'

import {
  approveVoucher,
  pendingVouchers,
  rejectVoucher,
  TIMEOUT_FOR_FULL_WAIT_S
} from '../../cli/engine/routes/vouchers'
import { requestBudgetFor } from '../../cli/requestBudget'

/** No budget header: the route waits the full sync interval. */
const NO_BUDGET = { budgetMs: undefined }

/**
 * A voucher that is not pending must not be reported as approved or denied.
 *
 * Core forwards whatever id it is given to the login server, so both calls
 * answered `{"ok": true}` and exit 0 for an arbitrary string — on an account
 * whose `pendingVouchers` was empty. That is the silent-wrong-answer shape
 * this branch removed from `change-enabled-token-ids` and from `balance-map
 * --token-id`, and it is worse here: an Edge voucher is a pending login the
 * login server *approves on a timer* unless it is rejected, so a caller who
 * mistyped an id, or passed one from a stale `OTP_REQUIRED`, was told an
 * unrecognised device had been denied while that device's login went on to
 * succeed.
 *
 * The success path cannot run in either offline suite: a voucher exists only
 * while a login is waiting on 2FA, and it cannot be driven on the shared
 * test account either, because that account has 2FA off and turning it on is
 * a credential change QA is not allowed to make. A stub account with a
 * pending voucher is what is left, and it is enough: the handler's whole job
 * is the list check and the forward.
 */
function makeCtx(
  body: Record<string, unknown>,
  pending: Array<{ voucherId: string }> | undefined,
  opts: { budgetMs?: number } = { budgetMs: 1000 }
): { ctx: any; approved: string[]; rejected: string[]; account: any } {
  const approved: string[] = []
  const rejected: string[] = []
  // `watch` reads `this`, as core's yaob object does: taking it off the
  // account and calling it bare threw in the fake world.
  const account = {
    pendingVouchers: pending,
    listeners: [] as Array<() => void>,
    watch(_name: string, callback: () => void) {
      this.listeners.push(callback)
      return () => {
        this.listeners.splice(this.listeners.indexOf(callback), 1)
      }
    },
    /** What core's login sync does to the list. */
    sync(next: Array<{ voucherId: string }>) {
      this.pendingVouchers = next
      for (const listener of [...this.listeners]) listener()
    },
    async approveVoucher(voucherId: string) {
      approved.push(voucherId)
    },
    async rejectVoucher(voucherId: string) {
      rejected.push(voucherId)
    }
  }
  return {
    approved,
    rejected,
    account,
    ctx: {
      params: { sessionId: 'session-1' },
      body,
      query: { valid: {} },
      // A one-second budget leaves no time to wait for a sync, so a miss
      // answers at once; the wait itself has its own cases below.
      req:
        opts.budgetMs == null
          ? undefined
          : { headers: { 'x-edge-timeout-ms': String(opts.budgetMs) } },
      arrivedAt: Date.now(),
      state: {
        logger: { info: () => {}, warn: () => {}, error: () => {} },
        sessions: { get: () => ({ account }) }
      }
    }
  }
}

const VOUCHER = { voucherId: 'v1', deviceDescription: 'a phone' }

describe('pending-vouchers', () => {
  it('answers an empty list before the login server has reported', () => {
    // Core leaves the field undefined until then, and the documented type is
    // an array either way.
    const { ctx } = makeCtx({}, undefined)
    expect(pendingVouchers.handler(ctx)).toStrictEqual({ pendingVouchers: [] })
  })

  it('answers what the account holds', () => {
    const { ctx } = makeCtx({}, [VOUCHER])
    expect(pendingVouchers.handler(ctx)).toStrictEqual({
      pendingVouchers: [VOUCHER]
    })
  })
})

describe('approve-voucher and reject-voucher', () => {
  it('forward a voucher that is pending', async () => {
    const approve = makeCtx({ voucherId: 'v1' }, [VOUCHER])
    expect(await approveVoucher.handler(approve.ctx)).toBeUndefined()
    expect(approve.approved).toStrictEqual(['v1'])

    const reject = makeCtx({ voucherId: 'v1' }, [VOUCHER])
    expect(await rejectVoucher.handler(reject.ctx)).toBeUndefined()
    expect(reject.rejected).toStrictEqual(['v1'])
  })

  it('refuse an id that is not pending, without calling core', async () => {
    const approve = makeCtx({ voucherId: 'nosuchvoucher' }, [VOUCHER])
    await expect(approveVoucher.handler(approve.ctx)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404
    })
    expect(approve.approved).toStrictEqual([])

    const reject = makeCtx({ voucherId: 'nosuchvoucher' }, [VOUCHER])
    await expect(rejectVoucher.handler(reject.ctx)).rejects.toMatchObject({
      code: 'NOT_FOUND'
    })
    expect(reject.rejected).toStrictEqual([])
  })

  it('says how long it waited when the budget left no time for a sync', async () => {
    // A one-second budget: the wait is zero, and the message must not claim
    // the call waited for a login sync.
    const { ctx } = makeCtx({ voucherId: 'nosuchvoucher' }, [VOUCHER])
    await expect(approveVoucher.handler(ctx)).rejects.toThrow(/waited 0 s/)
  })

  it('say that nothing is pending when nothing is', async () => {
    // The common case, and the one QA hit: an empty list is a different
    // message from "that one is not on the list", because the answer is
    // "there is no voucher to act on at all".
    const { ctx } = makeCtx({ voucherId: 'nosuchvoucher' }, [])
    await expect(rejectVoucher.handler(ctx)).rejects.toThrow(/none is/)
  })

  it('forward anything while the list is still unknown', async () => {
    // `undefined` is not an empty list: core has not heard from the login
    // server yet, so refusing here would refuse a voucher that may well
    // exist. The call goes through exactly as it did before.
    const { ctx, rejected } = makeCtx({ voucherId: 'v1' }, undefined)
    expect(await rejectVoucher.handler(ctx)).toBeUndefined()
    expect(rejected).toStrictEqual(['v1'])
  })
})

/**
 * A voucher core has not listed yet.
 *
 * Core refreshes `pendingVouchers` only on the account's login sync, every
 * 30 seconds, and the ordinary flow acts on a voucher right after another
 * device hit `OTP_REQUIRED` — inside that window.
 */
describe('a voucher the last sync has not listed', () => {
  it('waits for the next sync to list it', async () => {
    const { ctx, account, approved } = makeCtx(
      { voucherId: 'v1' },
      [],
      NO_BUDGET
    )
    const pending = approveVoucher.handler(ctx)
    account.sync([VOUCHER])
    await pending
    expect(approved).toStrictEqual(['v1'])
  })

  it('refuses once a sync interval passes, saying how old the list may be', async () => {
    const { ctx, approved } = makeCtx(
      { voucherId: 'nosuchvoucher' },
      [VOUCHER],
      NO_BUDGET
    )
    const settled = Promise.resolve(approveVoucher.handler(ctx)).catch(
      (error: unknown) => error
    )
    await jest.advanceTimersByTimeAsync(35_000)
    expect(String(await settled)).toMatch(/last login sync/)
    expect(approved).toStrictEqual([])
  })

  it('waits the full interval at the --timeout its message names', async () => {
    // The number the short-wait message gives has to be one that works:
    // run it through the client's budget and the route's own margin.
    const budgetMs = requestBudgetFor(TIMEOUT_FOR_FULL_WAIT_S * 1000)
    const { ctx } = makeCtx({ voucherId: 'nosuchvoucher' }, [VOUCHER], {
      budgetMs
    })
    const settled = Promise.resolve(approveVoucher.handler(ctx)).catch(
      (error: unknown) => error
    )
    await jest.advanceTimersByTimeAsync(35_000)
    expect(String(await settled)).toMatch(/this call waited for/)
  })
})
