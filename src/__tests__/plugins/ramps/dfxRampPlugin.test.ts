import { afterEach, describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { locale } from '../../../locales/intl'
import { makeDfxRequestQuery } from '../../../plugins/ramps/dfx/dfxRampPlugin'
import type { RampQuoteRequest } from '../../../plugins/ramps/rampPluginTypes'

const realLocaleId = locale.localeIdentifier

const makeRequest = (
  pluginId: string,
  overrides: Partial<RampQuoteRequest> = {}
): RampQuoteRequest => ({
  wallet: { currencyInfo: { pluginId } } as unknown as EdgeCurrencyWallet,
  tokenId: null,
  displayCurrencyCode: 'BTC',
  amountQuery: { exchangeAmount: '500' },
  fiatCurrencyCode: 'iso:CHF',
  amountType: 'fiat',
  direction: 'buy',
  regionCode: { countryCode: 'CH' },
  ...overrides
})

afterEach(() => {
  locale.localeIdentifier = realLocaleId
})

describe('makeDfxRequestQuery', () => {
  it('carries the fiat, amount and asset of a buy', () => {
    locale.localeIdentifier = 'de_CH'

    expect(makeDfxRequestQuery(makeRequest('bitcoin'), 'Edge')).toEqual({
      wallet: 'Edge',
      lang: 'de',
      blockchain: 'Bitcoin',
      'asset-in': 'CHF',
      'asset-out': 'BTC',
      'amount-in': '500'
    })
  })

  it('passes a crypto amount on a buy as the amount to receive', () => {
    const request = makeRequest('monero', {
      amountQuery: { exchangeAmount: '1.5' },
      amountType: 'crypto',
      fiatCurrencyCode: 'iso:EUR'
    })

    expect(makeDfxRequestQuery(request, 'Edge')).toEqual({
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Monero',
      'asset-in': 'EUR',
      'asset-out': 'XMR',
      'amount-out': '1.5'
    })
  })

  it('passes a crypto amount on a sell as the amount to send', () => {
    const request = makeRequest('solana', {
      amountQuery: { exchangeAmount: '2' },
      amountType: 'crypto',
      direction: 'sell'
    })

    expect(makeDfxRequestQuery(request, 'Edge')).toEqual({
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Solana',
      'asset-in': 'SOL',
      'asset-out': 'CHF',
      'amount-in': '2'
    })
  })

  it('leaves the amount out of a fiat-entered sell and a max quote', () => {
    const fiatSell = makeRequest('ethereum', { direction: 'sell' })
    const maxBuy = makeRequest('ethereum', { amountQuery: { max: true } })

    expect(makeDfxRequestQuery(fiatSell, 'Edge')).not.toHaveProperty(
      'amount-in'
    )
    expect(makeDfxRequestQuery(maxBuy, 'Edge')).not.toHaveProperty('amount-in')
  })

  it('falls back to English for languages DFX does not offer', () => {
    locale.localeIdentifier = 'ja_JP'

    expect(makeDfxRequestQuery(makeRequest('bitcoin'), 'Edge').lang).toBe('en')
  })
})
