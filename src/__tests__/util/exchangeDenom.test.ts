import { describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyConfig } from 'edge-core-js'

import {
  emptyEdgeDenomination,
  getExchangeDenom
} from '../../util/exchangeDenom'

const btc = { name: 'BTC', multiplier: '100000000', symbol: '₿' }
const usdc = { name: 'USDC', multiplier: '1000000', symbol: '' }

const currencyConfig = {
  currencyInfo: { pluginId: 'bitcoin', denominations: [btc] },
  allTokens: {
    deadbeef: { currencyCode: 'USDC', denominations: [usdc] }
  }
} as unknown as EdgeCurrencyConfig

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
