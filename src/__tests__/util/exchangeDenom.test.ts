import { describe, expect, it } from '@jest/globals'

import {
  emptyEdgeDenomination,
  getExchangeDenom
} from '../../util/exchangeDenom'
import {
  BTC_DENOM as btc,
  makeFakeDenomWallet,
  USDC_DENOM as usdc,
  USDC_TOKENS
} from '../../util/fake/fakeDisklet'

// From the shared fakes, not a third near-copy of the same shape: two other
// suites test denomination lookups against a wallet built this way, and a
// fixture that drifts is a test of a value the other tests do not use.
const currencyConfig = makeFakeDenomWallet({
  tokens: USDC_TOKENS
}).currencyConfig

describe('getExchangeDenom', () => {
  it('returns the native denomination for a null tokenId', () => {
    expect(getExchangeDenom(currencyConfig, null)).toStrictEqual(btc)
  })

  it('returns the token denomination for a known tokenId', () => {
    expect(getExchangeDenom(currencyConfig, 'deadbeef')).toStrictEqual(usdc)
  })

  it('returns the empty denomination for an unknown tokenId', () => {
    // This is the silent-wrong-number path: `multiplier: '1'` is used as the
    // divisor by the CSV, QBO and Bitwave exporters, so an export of an
    // unknown token would carry amounts scaled 1:1 into an accounting file
    // rather than failing. The route refuses an unknown tokenId before
    // reaching here (`assertTokenId`), and this pins what the fallback is.
    expect(getExchangeDenom(currencyConfig, 'notatoken')).toStrictEqual(
      emptyEdgeDenomination
    )
    expect(getExchangeDenom(currencyConfig, 'notatoken').multiplier).toBe('1')
  })

  it('returns a frozen empty denomination, so a caller cannot mutate it', () => {
    const denom = getExchangeDenom(currencyConfig, 'notatoken')
    expect(Object.isFrozen(denom)).toBe(true)
  })
})
