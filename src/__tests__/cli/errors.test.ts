import { describe, expect, it } from '@jest/globals'
import {
  ChallengeError,
  DustSpendError,
  InsufficientFundsError,
  NetworkError,
  NoAmountSpecifiedError,
  ObsoleteApiError,
  OtpError,
  PasswordError,
  PendingFundsError,
  PinDisabledError,
  SameCurrencyError,
  SpendToSelfError,
  SwapAboveLimitError,
  SwapAddressError,
  SwapBelowLimitError,
  SwapCurrencyError,
  SwapPermissionError,
  UsernameError
} from 'edge-core-js'

import { errorCodes } from '../../../docs/api/shared'
import { engineError, toErrorBody } from '../../cli/engine/errors'

const swapInfo = {
  pluginId: 'fakeswap',
  displayName: 'Fake Swap',
  supportEmail: 'support@example.com'
}

const swapRequest: any = {
  fromWallet: {
    id: 'w1',
    currencyConfig: { currencyInfo: { pluginId: 'bitcoin' } }
  },
  toWallet: {
    id: 'w2',
    currencyConfig: { currencyInfo: { pluginId: 'ethereum' } }
  },
  fromTokenId: null,
  toTokenId: null,
  nativeAmount: '1000',
  quoteFor: 'from'
}

/**
 * Every arm of `mapCoreError`, as a table.
 *
 * Two gates already check that a code a *route* declares exists in the
 * catalogue, but neither asserts that `mapCoreError` emits that code, with
 * that status, for the corresponding core error — so an arm returning the
 * wrong status, or an `asMaybe*` import that quietly stops matching after a
 * core upgrade, would fall through to the `INTERNAL_ERROR`/500 default with
 * every gate still green.
 */
const cases: Array<{
  code: string
  status: number
  error: unknown
  /**
   * The `details` the arm promises, with the values core supplied.
   *
   * Values rather than key names, because `toHaveProperty(key)` passes for a
   * key whose value is `undefined` — and every arm builds `details` as a
   * fixed object literal, so the key is always present. The old assertion
   * therefore held for a projection gutted to
   * `{ challengeId: undefined, challengeUri: undefined }`, which is the one
   * thing it existed to catch.
   */
  details?: Record<string, unknown>
}> = [
  {
    code: 'CHALLENGE_REQUIRED',
    status: 403,
    error: new ChallengeError({
      challengeId: 'cid',
      challengeUri: 'https://example.com/c'
    }),
    details: { challengeId: 'cid', challengeUri: 'https://example.com/c' }
  },
  {
    code: 'PASSWORD_ERROR',
    status: 401,
    error: new PasswordError({ wait_seconds: 30 }),
    // The caller needs the wait to know when to retry.
    details: { wait: 30 }
  },
  {
    code: 'OTP_REQUIRED',
    status: 401,
    // Every field populated, so all seven can be asserted by value. Three
    // of them were listed before and four were not, and the one that
    // mattered most was absent: `voucherAuth`, the second credential whose
    // redaction `redaction.test.ts` exists to pin. The two halves of that
    // guard did not meet.
    error: new OtpError({
      login_id: 'ZGVhZGJlZWY=',
      otp_reset_auth: 'reset-token',
      reason: 'ip',
      otp_timeout_date: '2026-01-01T00:00:00.000Z',
      voucher_activates: '2026-01-02T00:00:00.000Z',
      voucher_auth: 'dm91Y2hlcg==',
      voucher_id: 'v-1'
    }),
    details: {
      reason: 'ip',
      loginId: 'ZGVhZGJlZWY=',
      resetDate: '2026-01-01T00:00:00.000Z',
      resetToken: 'reset-token',
      voucherId: 'v-1',
      voucherAuth: 'dm91Y2hlcg==',
      voucherActivates: '2026-01-02T00:00:00.000Z'
    }
  },
  { code: 'USERNAME_ERROR', status: 400, error: new UsernameError() },
  {
    code: 'PIN_DISABLED',
    status: 403,
    error: new PinDisabledError('PIN login is disabled')
  },
  {
    code: 'INSUFFICIENT_FUNDS',
    status: 422,
    error: new InsufficientFundsError({ tokenId: null })
  },
  { code: 'DUST_SPEND', status: 422, error: new DustSpendError() },
  { code: 'PENDING_FUNDS', status: 422, error: new PendingFundsError() },
  { code: 'SPEND_TO_SELF', status: 422, error: new SpendToSelfError() },
  {
    code: 'NO_AMOUNT_SPECIFIED',
    status: 400,
    error: new NoAmountSpecifiedError()
  },
  { code: 'NETWORK_ERROR', status: 503, error: new NetworkError() },
  { code: 'OBSOLETE_API', status: 426, error: new ObsoleteApiError() },
  {
    code: 'SWAP_ABOVE_LIMIT',
    status: 422,
    error: new SwapAboveLimitError(swapInfo, '999'),
    // All three, not just the limit: a caller deciding what to do next needs
    // to know which side of the trade and which plugin imposed it.
    details: { direction: 'from', nativeMax: '999', swapPluginId: 'fakeswap' }
  },
  {
    code: 'SWAP_BELOW_LIMIT',
    status: 422,
    error: new SwapBelowLimitError(swapInfo, '1'),
    details: { direction: 'from', nativeMin: '1', swapPluginId: 'fakeswap' }
  },
  {
    code: 'SWAP_CURRENCY',
    status: 422,
    error: new SwapCurrencyError(swapInfo, swapRequest)
  },
  {
    code: 'SWAP_PERMISSION',
    status: 403,
    error: new SwapPermissionError(swapInfo, 'geoRestriction')
  },
  {
    code: 'SWAP_ADDRESS',
    status: 422,
    error: new SwapAddressError(swapInfo, { reason: 'mustMatch' })
  },
  { code: 'SAME_CURRENCY', status: 400, error: new SameCurrencyError() }
]

describe('toErrorBody', () => {
  it.each(cases)('maps $code to $status', ({ code, status, error }) => {
    const result = toErrorBody(error)
    expect(result.status).toBe(status)
    expect(result.body.error.code).toBe(code)
    // The status is repeated in the body for clients that only see the body.
    expect(result.body.error.status).toBe(status)
    expect(typeof result.body.error.message).toBe('string')
    expect(result.body.error.message).not.toBe('')
  })

  it.each(cases.filter(c => c.details != null))(
    '$code carries the details it promises',
    ({ details, error }) => {
      const { body } = toErrorBody(error)
      // `toMatchObject`, so a value core supplied has to arrive. `details`
      // is published per code in the generated reference, and a caller
      // branching on `resetToken` or `wait` needs the value, not the key.
      expect(body.error.details).toMatchObject(details ?? {})
    }
  )

  it('substitutes prose when core supplies an empty message', () => {
    // Most of core's error constructors take the message as an argument, so
    // an empty one is reachable, and `{"code":"PIN_DISABLED","message":""}`
    // tells a caller nothing the code did not already say.
    const { body } = toErrorBody(new PinDisabledError(''))
    expect(body.error.code).toBe('PIN_DISABLED')
    expect(body.error.message).not.toBe('')
  })

  it('passes an EngineError through unchanged', () => {
    const result = toErrorBody(
      engineError('OBJECT_IN_USE', 'busy', 409, { objectId: 'tx_1' })
    )
    expect(result).toStrictEqual({
      status: 409,
      body: {
        error: {
          code: 'OBJECT_IN_USE',
          message: 'busy',
          status: 409,
          details: { objectId: 'tx_1' }
        }
      }
    })
  })

  it('falls back to INTERNAL_ERROR/500 for anything unrecognised', () => {
    expect(toErrorBody(new Error('boom'))).toStrictEqual({
      status: 500,
      body: { error: { code: 'INTERNAL_ERROR', message: 'boom', status: 500 } }
    })
    // A thrown non-Error still has to produce a body rather than crash the
    // response path.
    expect(toErrorBody('boom').body.error.code).toBe('INTERNAL_ERROR')
    expect(toErrorBody(undefined).body.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('the published catalogue and mapCoreError agree', () => {
  const coreCodes = errorCodes.filter(e => e.origin === 'core')

  it('produces every code the reference documents as coming from core', () => {
    const produced = new Set(cases.map(c => c.code))
    const missing = coreCodes
      .map(e => e.code)
      .filter(code => !produced.has(code))
    expect(missing).toStrictEqual([])
  })

  it('uses the status the reference publishes for each code', () => {
    const published = new Map(coreCodes.map(e => [e.code, e.status]))
    for (const { code, status } of cases) {
      // No `?? status` fallback: comparing a value against itself whenever
      // the code is absent from the catalogue meant a case with a wrong code
      // *and* a wrong status passed both assertions in this describe — the
      // `missing` check above only tests catalogue ⊆ cases.
      expect(published.has(code)).toBe(true)
      expect({ code, status }).toStrictEqual({
        code,
        status: published.get(code)
      })
    }
  })
})
