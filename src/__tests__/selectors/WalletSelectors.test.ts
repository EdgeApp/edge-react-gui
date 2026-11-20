import { describe, expect, it } from '@jest/globals'

import type { GuiExchangeRates } from '../../actions/ExchangeRateActions'
import {
  type ConvertibleAsset,
  convertNativeBetweenAssets
} from '../../selectors/WalletSelectors'

const makeRates = (rates: Record<string, number>): GuiExchangeRates => {
  const crypto: Record<string, unknown> = {}
  for (const pluginId of Object.keys(rates)) {
    crypto[pluginId] = {
      '': {
        'iso:USD': {
          current: rates[pluginId],
          yesterday: 0,
          yesterdayTimestamp: 0,
          expiration: 0
        }
      }
    }
  }
  return { crypto, fiat: {} } as unknown as GuiExchangeRates
}

const btc: ConvertibleAsset = {
  pluginId: 'bitcoin',
  tokenId: null,
  multiplier: '100000000'
}
const eth: ConvertibleAsset = {
  pluginId: 'ethereum',
  tokenId: null,
  multiplier: '1000000000000000000'
}

describe('convertNativeBetweenAssets', () => {
  it('returns the amount worth the same, in the target denomination', () => {
    const rates = makeRates({ bitcoin: 100000, ethereum: 4000 })

    // 1 ETH at $4,000 is 0.04 BTC at $100,000:
    expect(
      convertNativeBetweenAssets(
        rates,
        'iso:USD',
        '1000000000000000000',
        eth,
        btc
      )
    ).toBe('4000000')
  })

  it('drops the fraction of a native unit', () => {
    const rates = makeRates({ bitcoin: 3, ethereum: 1 })

    expect(
      convertNativeBetweenAssets(
        rates,
        'iso:USD',
        '1000000000000000000',
        eth,
        btc
      )
    ).toBe('33333333')
  })

  it('handles a rate small enough to print in scientific notation', () => {
    const rates = makeRates({ bitcoin: 100000, ethereum: 1e-7 })

    expect(
      convertNativeBetweenAssets(rates, 'iso:USD', '100000000', btc, eth)
    ).toBe('1000000000000000000000000000000')
  })

  it('returns undefined when either asset has no rate', () => {
    const rates = makeRates({ bitcoin: 100000 })

    expect(
      convertNativeBetweenAssets(rates, 'iso:USD', '100', eth, btc)
    ).toBeUndefined()
    expect(
      convertNativeBetweenAssets(rates, 'iso:USD', '100', btc, eth)
    ).toBeUndefined()
  })
})
