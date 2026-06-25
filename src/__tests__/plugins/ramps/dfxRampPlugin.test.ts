import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { PluginViewParams } from '../../../components/scenes/GuiPluginViewScene'
import { locale } from '../../../locales/intl'
import {
  dfxRampPlugin,
  makeDfxRequestQuery
} from '../../../plugins/ramps/dfx/dfxRampPlugin'
import { fetchDfxSessionQuery } from '../../../plugins/ramps/dfx/dfxSession'
import type {
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'

jest.mock('../../../components/services/AirshipInstance', () => ({
  showToastSpinner: async (message: string, promise: Promise<unknown>) =>
    await promise
}))

jest.mock('../../../plugins/ramps/dfx/dfxSession', () => ({
  ...jest.requireActual<object>('../../../plugins/ramps/dfx/dfxSession'),
  fetchDfxSessionQuery: jest.fn()
}))

const mockFetchSessionQuery = jest.mocked(fetchDfxSessionQuery)
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

describe('dfxRampPlugin approveQuote', () => {
  /** Approves the plugin's quote and returns the deep query it opened. */
  async function approveDeepQuery(
    request: RampQuoteRequest
  ): Promise<PluginViewParams['deepQuery']> {
    const navigate = jest.fn()
    const plugin = dfxRampPlugin({
      initOptions: {},
      navigation: { navigate }
    } as unknown as RampPluginConfig)

    const [quote] = await plugin.fetchQuotes(request)
    await quote.approveQuote({ coreWallet: request.wallet })

    expect(navigate).toHaveBeenCalledTimes(1)
    const [, params] = navigate.mock.calls[0] as [string, PluginViewParams]
    return params.deepQuery
  }

  const request = makeRequest('bitcoin')
  const requestQuery = {
    wallet: 'Edge',
    lang: 'en',
    blockchain: 'Bitcoin',
    'asset-in': 'CHF',
    'asset-out': 'BTC',
    'amount-in': '500'
  }

  it('keeps the quote choices when the login is unavailable', async () => {
    mockFetchSessionQuery.mockResolvedValueOnce(undefined)

    expect(await approveDeepQuery(request)).toEqual(requestQuery)
  })

  it('adds the session to the quote choices after a login', async () => {
    mockFetchSessionQuery.mockResolvedValueOnce({ session: 'jwt' })

    expect(await approveDeepQuery(request)).toEqual({
      ...requestQuery,
      session: 'jwt'
    })
  })
})
