import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import {
  approveVoucher,
  pendingVouchers,
  rejectVoucher
} from '../../cli/engine/routes/vouchers'

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
  pending: Array<{ voucherId: string }> | undefined
): { ctx: any; approved: string[]; rejected: string[] } {
  const approved: string[] = []
  const rejected: string[] = []
  const account = {
    pendingVouchers: pending,
    async approveVoucher(voucherId: string) {
      approved.push(voucherId)
    },
    async rejectVoucher(voucherId: string) {
      rejected.push(voucherId)
    }
  } as unknown as EdgeAccount
  return {
    approved,
    rejected,
    ctx: {
      params: { sessionId: 'session-1' },
      body,
      query: { valid: {} },
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
