import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import URL from 'url-parse'

import type { PluginViewParams } from '../../../components/scenes/GuiPluginViewScene'
import { locale } from '../../../locales/intl'
import type { FiatPluginOpenWebViewParams } from '../../../plugins/gui/scenes/FiatPluginWebView'
import { fetchDfxSellCryptoAmount } from '../../../plugins/ramps/dfx/dfxQuote'
import {
  dfxRampPlugin,
  makeDfxRequestQuery
} from '../../../plugins/ramps/dfx/dfxRampPlugin'
import { fetchDfxSessionQuery } from '../../../plugins/ramps/dfx/dfxSession'
import type {
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'
import { RampIpCountryError } from '../../../types/RampIpCountryError'

jest.mock('../../../components/services/AirshipInstance', () => ({
  showError: jest.fn(),
  showToast: jest.fn(),
  showToastSpinner: async (message: string, promise: Promise<unknown>) =>
    await promise
}))

jest.mock('../../../components/services/PermissionsManager', () => ({
  requestPermissionOnSettings: async () => false
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
      assets: 'Bitcoin/BTC',
      'asset-in': 'CHF',
      'asset-out': 'BTC',
      'amount-in': '500'
    })
  })

  it('passes a crypto amount on a buy as the amount to receive', () => {
    const request = makeRequest('bitcoin', {
      amountQuery: { exchangeAmount: '1.5' },
      amountType: 'crypto',
      fiatCurrencyCode: 'iso:EUR'
    })

    expect(makeDfxRequestQuery(request, 'Edge')).toEqual({
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Bitcoin',
      assets: 'Bitcoin/BTC',
      'asset-in': 'EUR',
      'asset-out': 'BTC',
      'amount-out': '1.5'
    })
  })

  it('passes a crypto amount on a sell as the amount to send', () => {
    const request = makeRequest('polygon', {
      amountQuery: { exchangeAmount: '2' },
      amountType: 'crypto',
      direction: 'sell'
    })

    expect(makeDfxRequestQuery(request, 'Edge')).toEqual({
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Polygon',
      assets: 'Polygon/POL',
      'asset-in': 'POL',
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
      assets: 'Ethereum/ETH',
      'asset-in': 'ETH',
      'asset-out': 'CHF',
      'amount-out': '500'
    })
  })

  it("passes a sell's Max as the amount to send", () => {
    const maxSell = makeRequest('bitcoin', {
      amountQuery: { maxExchangeAmount: '0.00041' },
      amountType: 'crypto',
      direction: 'sell'
    })

    expect(makeDfxRequestQuery(maxSell, 'Edge')).toEqual({
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Bitcoin',
      'asset-in': 'BTC',
      'asset-out': 'CHF',
      assets: 'Bitcoin/BTC',
      'amount-in': '0.00041'
    })
  })

  it.each([
    ['an EVM Max', '0.123456789012345678', '0.12345678'],
    ['a Max with 8 decimals', '0.99999999', '0.99999999']
  ])('rounds %s down to 8 decimals', (name, maxExchangeAmount, amountIn) => {
    const maxSell = makeRequest('ethereum', {
      amountQuery: { maxExchangeAmount },
      amountType: 'crypto',
      direction: 'sell'
    })

    expect(makeDfxRequestQuery(maxSell, 'Edge')['amount-in']).toBe(amountIn)
  })

  it("passes a Max below 8 decimals as 0, not DFX's default", () => {
    const dustSell = makeRequest('ethereum', {
      amountQuery: { maxExchangeAmount: '0.000000001' },
      amountType: 'crypto',
      direction: 'sell'
    })

    expect(makeDfxRequestQuery(dustSell, 'Edge')['amount-in']).toBe('0')
  })

  it('locks a buy to the asset and chain of the wallet', () => {
    const query = makeDfxRequestQuery(makeRequest('arbitrum'), 'Edge')

    expect(query.blockchain).toBe('Arbitrum')
    expect(query.assets).toBe('Arbitrum/ETH')
  })

  it('sets no asset filter for a chain DFX is not offered on', () => {
    const query = makeDfxRequestQuery(makeRequest('litecoin'), 'Edge')

    expect(query).not.toHaveProperty('blockchain')
    expect(query).not.toHaveProperty('assets')
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

describe('dfxRampPlugin checkSupport', () => {
  const checkSupport = async (pluginId: string): Promise<boolean> => {
    const plugin = dfxRampPlugin({
      initOptions: {},
      navigation: { navigate: jest.fn() }
    } as unknown as RampPluginConfig)
    const { supported } = await plugin.checkSupport({
      direction: 'buy',
      regionCode: { countryCode: 'CH' },
      fiatAsset: { currencyCode: 'CHF' },
      cryptoAsset: { pluginId, tokenId: null }
    })
    return supported
  }

  it('offers DFX where Edge logs the wallet in', async () => {
    expect(await checkSupport('bitcoin')).toBe(true)
    expect(await checkSupport('ethereum')).toBe(true)
  })

  it('does not offer DFX where Edge does not log the wallet in', async () => {
    expect(await checkSupport('monero')).toBe(false)
    expect(await checkSupport('solana')).toBe(false)
  })
})

describe('dfxRampPlugin approveQuote', () => {
  /** Approves the plugin's quote and returns the scene it opened. */
  async function approveRoute(
    request: RampQuoteRequest
  ): Promise<[string, unknown]> {
    const navigate = jest.fn()
    const plugin = dfxRampPlugin({
      initOptions: {},
      navigation: { navigate }
    } as unknown as RampPluginConfig)

    const [quote] = await plugin.fetchQuotes(request)
    await quote.approveQuote({ coreWallet: request.wallet })

    expect(navigate).toHaveBeenCalledTimes(1)
    return navigate.mock.calls[0] as [string, unknown]
  }

  /** Approves the plugin's quote and returns the deep query it opened. */
  async function approveDeepQuery(
    request: RampQuoteRequest
  ): Promise<PluginViewParams['deepQuery']> {
    const [, params] = await approveRoute(request)
    return (params as PluginViewParams).deepQuery
  }

  /** Approves a logged-in sell and returns the query DFX's page opened with. */
  async function approveSellQuery(
    request: RampQuoteRequest
  ): Promise<Record<string, string | undefined>> {
    const [route, params] = await approveRoute(request)
    expect(route).toBe('guiPluginWebView')
    const url = new URL((params as FiatPluginOpenWebViewParams).url, true)
    expect(`${url.origin}${url.pathname}`).toBe('https://app.dfx.swiss/sell')
    return url.query
  }

  const request = makeRequest('bitcoin')
  const requestQuery = {
    wallet: 'Edge',
    lang: 'en',
    blockchain: 'Bitcoin',
    assets: 'Bitcoin/BTC',
    'asset-in': 'CHF',
    'asset-out': 'BTC',
    'amount-in': '500'
  }

  it('keeps the quote choices when the login fails', async () => {
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

  it('opens a buy in the plugin scene without a payment redirect', async () => {
    mockFetchSessionQuery.mockResolvedValueOnce({ session: 'jwt' })

    const [route, params] = await approveRoute(request)

    expect(route).toBe('pluginViewBuy')
    expect((params as PluginViewParams).deepPath).toBe('/buy')
    expect((params as PluginViewParams).deepQuery).not.toHaveProperty(
      'redirect-uri'
    )
  })

  describe('a crypto-entered sell', () => {
    const cryptoSell = makeRequest('bitcoin', {
      amountQuery: { exchangeAmount: '0.01' },
      amountType: 'crypto',
      direction: 'sell'
    })
    const sellQuery = {
      wallet: 'Edge',
      lang: 'en',
      blockchain: 'Bitcoin',
      'asset-in': 'BTC',
      'asset-out': 'CHF',
      assets: 'Bitcoin/BTC',
      'amount-in': '0.01'
    }

    it('hands the payment back to Edge after a login', async () => {
      mockFetchSessionQuery.mockResolvedValueOnce({ session: 'jwt' })

      expect(await approveSellQuery(cryptoSell)).toEqual({
        ...sellQuery,
        session: 'jwt',
        'redirect-uri': 'https://deep.edge.app/redirect/payment/dfx/bitcoin/'
      })
    })

    it('opens the plugin scene as before without a login', async () => {
      mockFetchSessionQuery.mockResolvedValueOnce(undefined)

      const [route, params] = await approveRoute(cryptoSell)

      expect(route).toBe('pluginViewSell')
      expect(params).toEqual({
        plugin: expect.objectContaining({ pluginId: 'dfx' }),
        deepPath: '/sell',
        deepQuery: sellQuery
      })
    })

    it('opens the plugin scene as before with an empty session', async () => {
      mockFetchSessionQuery.mockResolvedValueOnce({ session: '' })

      const [route] = await approveRoute(cryptoSell)

      expect(route).toBe('pluginViewSell')
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
      assets: 'Bitcoin/BTC',
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
      assets: 'Bitcoin/BTC',
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
      'asset-out': 'EUR',
      assets: 'Bitcoin/BTC'
    }

    it('opens with the crypto amount DFX quotes for the fiat', async () => {
      mockFetchSessionQuery.mockResolvedValueOnce({ session: 'jwt' })
      mockFetchSellCryptoAmount.mockResolvedValueOnce('0.003502')

      expect(await approveSellQuery(fiatSell)).toEqual({
        ...sellQuery,
        'amount-in': '0.003502',
        session: 'jwt',
        'redirect-uri': 'https://deep.edge.app/redirect/payment/dfx/bitcoin/'
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

  it("opens a sell's Max with the amount rounded down to 8 decimals", async () => {
    mockFetchSessionQuery.mockResolvedValueOnce({ session: 'jwt' })
    const maxSell = makeRequest('ethereum', {
      amountQuery: { maxExchangeAmount: '0.123456789012345678' },
      amountType: 'crypto',
      direction: 'sell'
    })

    const query = await approveSellQuery(maxSell)

    expect(query['amount-in']).toBe('0.12345678')
    expect(query.assets).toBe('Ethereum/ETH')
  })

  // Sells approve through the plugin's own sell launcher, not the helper's,
  // so each refusal is checked for both:
  const sellRequest = makeRequest('bitcoin', { direction: 'sell' })
  const blockedCountry = new RampIpCountryError('DFX', 'Forbidden')
  const failedLogin = new Error(
    'Failed to connect your wallet to DFX. Please try again.'
  )
  it.each([
    ['a buy', 'DFX blocks the country', request, blockedCountry],
    ['a sell', 'DFX blocks the country', sellRequest, blockedCountry],
    ['a buy', 'the login fails', request, failedLogin],
    ['a sell', 'the login fails', sellRequest, failedLogin]
  ])(
    'does not open DFX for %s when %s',
    async (kind, reason, refusedRequest, error) => {
      mockFetchSessionQuery.mockRejectedValueOnce(error)
      const navigate = jest.fn()
      const plugin = dfxRampPlugin({
        initOptions: {},
        navigation: { navigate }
      } as unknown as RampPluginConfig)

      const [quote] = await plugin.fetchQuotes(refusedRequest)
      await expect(
        quote.approveQuote({ coreWallet: refusedRequest.wallet })
      ).rejects.toBe(error)
      expect(navigate).not.toHaveBeenCalled()
    }
  )
})
