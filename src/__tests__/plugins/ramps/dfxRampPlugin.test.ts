import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { PluginViewParams } from '../../../components/scenes/GuiPluginViewScene'
import { locale } from '../../../locales/intl'
import { fetchDfxSellCryptoAmount } from '../../../plugins/ramps/dfx/dfxQuote'
import {
  dfxRampPlugin,
  makeDfxRequestQuery
} from '../../../plugins/ramps/dfx/dfxRampPlugin'
import {
  DfxIpCountryError,
  fetchDfxSessionQuery
} from '../../../plugins/ramps/dfx/dfxSession'
import type {
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'

jest.mock('../../../components/services/AirshipInstance', () => ({
  showToastSpinner: async (message: string, promise: Promise<unknown>) =>
    await promise
}))

jest.mock('../../../plugins/ramps/dfx/dfxQuote', () => ({
  fetchDfxSellCryptoAmount: jest.fn()
}))

jest.mock('../../../plugins/ramps/dfx/dfxSession', () => ({
  ...jest.requireActual<object>('../../../plugins/ramps/dfx/dfxSession'),
  fetchDfxSessionQuery: jest.fn()
}))

const mockFetchSessionQuery = jest.mocked(fetchDfxSessionQuery)
const mockFetchSellCryptoAmount = jest.mocked(fetchDfxSellCryptoAmount)
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
  jest.clearAllMocks()
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

  it('passes a fiat amount on a sell as the amount to receive', () => {
    const fiatSell = makeRequest('ethereum', { direction: 'sell' })

    expect(makeDfxRequestQuery(fiatSell, 'Edge')).toEqual({
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Ethereum',
      'asset-in': 'ETH',
      'asset-out': 'CHF',
      'amount-out': '500'
    })
  })

  it('leaves the amount out of a max quote', () => {
    const maxBuy = makeRequest('ethereum', { amountQuery: { max: true } })
    const query = makeDfxRequestQuery(maxBuy, 'Edge')

    expect(query).not.toHaveProperty('amount-in')
    expect(query).not.toHaveProperty('amount-out')
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

  it('does not quote a crypto-entered buy', async () => {
    mockFetchSessionQuery.mockResolvedValueOnce(undefined)
    const cryptoBuy = makeRequest('bitcoin', {
      amountQuery: { exchangeAmount: '0.01' },
      amountType: 'crypto'
    })

    expect(await approveDeepQuery(cryptoBuy)).toEqual({
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Bitcoin',
      'asset-in': 'CHF',
      'asset-out': 'BTC',
      'amount-out': '0.01'
    })
    expect(mockFetchSellCryptoAmount).not.toHaveBeenCalled()
  })

  it('does not quote a crypto-entered sell', async () => {
    mockFetchSessionQuery.mockResolvedValueOnce(undefined)
    const cryptoSell = makeRequest('bitcoin', {
      amountQuery: { exchangeAmount: '0.01' },
      amountType: 'crypto',
      direction: 'sell'
    })

    expect(await approveDeepQuery(cryptoSell)).toEqual({
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Bitcoin',
      'asset-in': 'BTC',
      'asset-out': 'CHF',
      'amount-in': '0.01'
    })
    expect(mockFetchSellCryptoAmount).not.toHaveBeenCalled()
  })

  describe('a fiat-entered sell', () => {
    const fiatSell = makeRequest('bitcoin', {
      direction: 'sell',
      amountQuery: { exchangeAmount: '200' },
      fiatCurrencyCode: 'iso:EUR'
    })
    const sellQuery = {
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Bitcoin',
      'asset-in': 'BTC',
      'asset-out': 'EUR'
    }

    it('opens with the crypto amount DFX quotes for the fiat', async () => {
      mockFetchSessionQuery.mockResolvedValueOnce({ session: 'jwt' })
      mockFetchSellCryptoAmount.mockResolvedValueOnce('0.003502')

      expect(await approveDeepQuery(fiatSell)).toEqual({
        ...sellQuery,
        'amount-in': '0.003502',
        session: 'jwt'
      })
      expect(mockFetchSellCryptoAmount).toHaveBeenCalledWith({
        blockchain: 'Bitcoin',
        asset: 'BTC',
        fiat: 'EUR',
        fiatAmount: '200'
      })
    })

    it('keeps the fiat amount when DFX cannot quote it', async () => {
      mockFetchSessionQuery.mockResolvedValueOnce(undefined)
      mockFetchSellCryptoAmount.mockResolvedValueOnce(undefined)

      expect(await approveDeepQuery(fiatSell)).toEqual({
        ...sellQuery,
        'amount-out': '200'
      })
    })
  })

  it('does not open DFX when it blocks the country', async () => {
    mockFetchSessionQuery.mockRejectedValueOnce(new DfxIpCountryError())
    const navigate = jest.fn()
    const plugin = dfxRampPlugin({
      initOptions: {},
      navigation: { navigate }
    } as unknown as RampPluginConfig)

    const [quote] = await plugin.fetchQuotes(request)
    await expect(
      quote.approveQuote({ coreWallet: request.wallet })
    ).rejects.toBeInstanceOf(DfxIpCountryError)
    expect(navigate).not.toHaveBeenCalled()
  })
})
