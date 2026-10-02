import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { FiatProviderError } from '../../../plugins/gui/fiatProviderTypes'
import { btcdirectRampPlugin } from '../../../plugins/ramps/btcdirect/btcdirectRampPlugin'
import type { RampLinkHandler } from '../../../plugins/ramps/rampDeeplinkHandler'
import type {
  RampCheckSupportRequest,
  RampPlugin,
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'
import { openExternalWebView } from '../../../plugins/ramps/utils/webViewUtils'

jest.mock('../../../plugins/ramps/utils/webViewUtils', () => ({
  openExternalWebView: jest.fn(async () => 'deeplink-token')
}))

jest.mock('../../../util/rnUtils', () => ({
  makeUuid: async () => 'test-order-id'
}))

interface FetchCall {
  pathname: string
  body: Record<string, unknown>
  authorization?: string
}

interface FetchOptions {
  body?: string
  headers?: Record<string, string>
}

const CHECKOUT_URL = 'https://checkout.btcdirect.test/?signature=abc'
const RETURN_URL =
  'https://return.edge.app/fiatprovider/buy/btcdirect?orderId=test-order-id'

let fetchCalls: FetchCall[] = []
const realFetch = global.fetch
const onLogEvent = jest.fn()

const jsonResponse = (body: unknown): Response =>
  ({
    ok: true,
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as unknown as Response)

const currencyPair = (
  code: string,
  caip19: string | null,
  status: string = 'enabled'
): object => ({
  currencyPair: `${code}-EUR`,
  baseCurrency: { code, ticker: code, chain: null, decimals: 8, caip19 },
  quoteCurrency: { code: 'EUR', name: 'Euro', decimals: 2 },
  buy: {
    status,
    min: { amount: 30, currencyCode: 'EUR' },
    max: { amount: 101000, currencyCode: 'EUR' }
  }
})

/** Answers with the response shapes from the BTC Direct API reference. */
const fakeFetch = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const { pathname } = new URL(url)
  const body: Record<string, unknown> =
    options.body == null ? {} : JSON.parse(options.body)
  fetchCalls.push({
    pathname,
    body,
    authorization: options.headers?.Authorization
  })

  switch (pathname) {
    case '/api/v1/authenticate':
      return jsonResponse({ token: 'test-token', refreshToken: 'refresh' })
    case '/api/v1/system/currency-pairs':
      return jsonResponse([
        currencyPair('BTC', 'bip122:000000000019d6689c085ae165831e93/slip44:0'),
        currencyPair('POL', null),
        currencyPair(
          'LTC',
          'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2',
          'disabled'
        ),
        { currencyPair: 'unparseable' }
      ])
    case '/api/v1/buy/payment-methods/preferred':
      return jsonResponse({
        paymentMethods: [
          { code: 'creditCard', label: 'Credit Card', limit: 1000 },
          { code: 'iDeal', label: 'iDEAL', limit: 50000 },
          { code: 'bankTransfer', label: 'Bank Transfer', limit: 10000 },
          { code: 'bancontact', label: 'Bancontact', limit: 1000 }
        ],
        countries: {
          nl: ['iDeal', 'creditCard', 'bankTransfer'],
          be: ['bancontact', 'creditCard', 'bankTransfer']
        }
      })
    case '/api/v1/buy/quote': {
      const fiatAmount = Number(body.fiatAmount)
      return jsonResponse({
        currencyPair: body.currencyPair,
        fiatAmount,
        cryptoAmount: fiatAmount / 100000,
        paymentMethod: body.paymentMethod,
        expiryDate: '2030-01-01T00:00:00Z'
      })
    }
    case '/api/v2/buy/checkout':
      return jsonResponse({ checkoutUrl: CHECKOUT_URL })
  }
  throw new Error(`Unexpected fetch ${url}`)
}

const makePlugin = (): RampPlugin => {
  const config: RampPluginConfig = {
    initOptions: {
      username: 'partner',
      password: 'secret',
      apiUrl: 'https://api.btcdirect.test'
    },
    store: {
      deleteItem: async () => {},
      listItemIds: async () => [],
      getItem: async () => '',
      setItem: async () => {}
    },

    account: {
      currencyConfig: { polygon: {} }
    } as unknown as RampPluginConfig['account'],
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    navigation: {} as RampPluginConfig['navigation'],
    onLogEvent,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    disklet: {} as RampPluginConfig['disklet']
  }
  return btcdirectRampPlugin(config)
}

const makeSupportRequest = (
  overrides: Partial<RampCheckSupportRequest> = {}
): RampCheckSupportRequest => ({
  direction: 'buy',
  regionCode: { countryCode: 'NL' },
  fiatAsset: { currencyCode: 'EUR' },
  cryptoAsset: { pluginId: 'bitcoin', tokenId: null },
  ...overrides
})

const makeQuoteRequest = (
  overrides: Partial<RampQuoteRequest> = {}
): RampQuoteRequest => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  wallet: { currencyInfo: { pluginId: 'bitcoin' } } as EdgeCurrencyWallet,
  tokenId: null,
  displayCurrencyCode: 'BTC',
  fiatCurrencyCode: 'iso:EUR',
  amountType: 'fiat',
  amountQuery: { exchangeAmount: '100' },
  direction: 'buy',
  regionCode: { countryCode: 'NL' },
  ...overrides
})

describe('btcdirectRampPlugin', () => {
  beforeEach(() => {
    fetchCalls = []
    onLogEvent.mockClear()
    jest.mocked(openExternalWebView).mockClear()

    global.fetch = fakeFetch as typeof global.fetch
  })

  afterEach(() => {
    global.fetch = realFetch
  })

  describe('checkSupport', () => {
    it('supports an enabled EUR pair in a served country', async () => {
      const plugin = makePlugin()
      expect(await plugin.checkSupport(makeSupportRequest())).toEqual({
        supported: true,
        supportedAmountTypes: ['fiat']
      })
    })

    it('authenticates once and sends the partner token', async () => {
      const plugin = makePlugin()
      await plugin.checkSupport(makeSupportRequest())
      await plugin.checkSupport(makeSupportRequest())

      const authCalls = fetchCalls.filter(
        call => call.pathname === '/api/v1/authenticate'
      )
      expect(authCalls).toHaveLength(1)
      expect(authCalls[0].body).toEqual({
        username: 'partner',
        password: 'secret'
      })
      // The provider config is cached, so each endpoint is called once:
      const dataCalls = fetchCalls.filter(
        call => call.pathname !== '/api/v1/authenticate'
      )
      expect(dataCalls.map(call => call.pathname).sort()).toEqual([
        '/api/v1/buy/payment-methods/preferred',
        '/api/v1/system/currency-pairs'
      ])
      for (const call of dataCalls) {
        expect(call.authorization).toBe('Bearer test-token')
      }
    })

    it('signs in again when the token is rejected', async () => {
      let rejected = false
      global.fetch = (async (url: string, options: FetchOptions = {}) => {
        const { pathname } = new URL(url)
        if (pathname === '/api/v1/system/currency-pairs' && !rejected) {
          rejected = true
          return { ok: false, status: 401 } as unknown as Response
        }
        return await fakeFetch(url, options)
      }) as typeof global.fetch

      const plugin = makePlugin()
      const result = await plugin.checkSupport(makeSupportRequest())

      expect(result.supported).toBe(true)
      const authCalls = fetchCalls.filter(
        call => call.pathname === '/api/v1/authenticate'
      )
      expect(authCalls).toHaveLength(2)
    })

    it('maps a native asset without a CAIP-19 identifier by plugin', async () => {
      const plugin = makePlugin()
      const result = await plugin.checkSupport(
        makeSupportRequest({
          cryptoAsset: { pluginId: 'polygon', tokenId: null }
        })
      )
      expect(result.supported).toBe(true)
    })

    it.each<[string, Partial<RampCheckSupportRequest>]>([
      ['sell', { direction: 'sell' }],
      ['a non-EUR fiat', { fiatAsset: { currencyCode: 'USD' } }],
      ['an unserved country', { regionCode: { countryCode: 'US' } }],
      [
        'a disabled pair',
        { cryptoAsset: { pluginId: 'litecoin', tokenId: null } }
      ],
      [
        'an unlisted asset',
        { cryptoAsset: { pluginId: 'dogecoin', tokenId: null } }
      ]
    ])('rejects %s', async (_name, overrides) => {
      const plugin = makePlugin()
      expect(await plugin.checkSupport(makeSupportRequest(overrides))).toEqual({
        supported: false
      })
    })
  })

  describe('fetchQuotes', () => {
    it('quotes each payment method offered in the country', async () => {
      const plugin = makePlugin()
      const quotes = await plugin.fetchQuotes(makeQuoteRequest())

      expect(quotes.map(quote => quote.paymentType)).toEqual([
        'credit',
        'ideal',
        'sepa'
      ])
      expect(quotes[0]).toMatchObject({
        pluginId: 'btcdirect',
        fiatAmount: '100',
        cryptoAmount: '0.001',
        isEstimate: false,
        expirationDate: new Date('2030-01-01T00:00:00Z')
      })
      const quoteBodies = fetchCalls
        .filter(call => call.pathname === '/api/v1/buy/quote')
        .map(call => call.body)
      expect(quoteBodies).toEqual([
        {
          currencyPair: 'BTC-EUR',
          paymentMethod: 'creditCard',
          fiatAmount: 100
        },
        { currencyPair: 'BTC-EUR', paymentMethod: 'iDeal', fiatAmount: 100 },
        {
          currencyPair: 'BTC-EUR',
          paymentMethod: 'bankTransfer',
          fiatAmount: 100
        }
      ])
    })

    it('skips payment methods the country does not offer', async () => {
      const plugin = makePlugin()
      const quotes = await plugin.fetchQuotes(
        makeQuoteRequest({ regionCode: { countryCode: 'BE' } })
      )
      expect(quotes.map(quote => quote.paymentType)).toEqual(['credit', 'sepa'])
    })

    it('returns no quotes for a crypto amount', async () => {
      const plugin = makePlugin()
      expect(
        await plugin.fetchQuotes(makeQuoteRequest({ amountType: 'crypto' }))
      ).toEqual([])
    })

    it('reports the pair minimum for an amount under the limit', async () => {
      const plugin = makePlugin()
      const error: unknown = await plugin
        .fetchQuotes(
          makeQuoteRequest({ amountQuery: { exchangeAmount: '10' } })
        )
        .then(
          () => undefined,
          (e: unknown) => e
        )
      if (!(error instanceof FiatProviderError)) {
        throw new Error('Expected a FiatProviderError')
      }
      expect(error.quoteError).toEqual({
        providerId: 'btcdirect',
        errorType: 'underLimit',
        errorAmount: 30,
        displayCurrencyCode: 'EUR'
      })
    })

    it('drops only the payment methods whose limit is exceeded', async () => {
      const plugin = makePlugin()
      const quotes = await plugin.fetchQuotes(
        makeQuoteRequest({ amountQuery: { exchangeAmount: '5000' } })
      )
      expect(quotes.map(quote => quote.paymentType)).toEqual(['ideal', 'sepa'])
    })

    it('quotes the payment method limit for a max request', async () => {
      const plugin = makePlugin()
      const quotes = await plugin.fetchQuotes(
        makeQuoteRequest({ amountQuery: { max: true } })
      )
      expect(quotes.map(quote => quote.fiatAmount)).toEqual([
        '1000',
        '50000',
        '10000'
      ])
    })

    it('scales a max request down to a crypto cap', async () => {
      const plugin = makePlugin()
      const quotes = await plugin.fetchQuotes(
        makeQuoteRequest({ amountQuery: { maxExchangeAmount: '0.005' } })
      )
      expect(quotes.map(quote => quote.fiatAmount)).toEqual([
        '500',
        '500',
        '500'
      ])
    })
  })

  describe('approveQuote', () => {
    const approve = async (): Promise<RampLinkHandler> => {
      const plugin = makePlugin()
      const [quote] = await plugin.fetchQuotes(makeQuoteRequest())
      await quote.approveQuote({
        coreWallet: {
          getAddresses: async () => [{ publicAddress: 'bc1qtest' }]
        } as unknown as EdgeCurrencyWallet
      })
      const params = jest.mocked(openExternalWebView).mock.calls[0][0]
      expect(params.url).toBe(CHECKOUT_URL)
      if (params.deeplink == null) throw new Error('Missing deeplink')
      expect(params.deeplink).toMatchObject({
        direction: 'buy',
        providerId: 'btcdirect'
      })
      return params.deeplink.handler
    }

    it('opens the checkout created for the quote', async () => {
      await approve()
      const checkoutCall = fetchCalls.find(
        call => call.pathname === '/api/v2/buy/checkout'
      )
      expect(checkoutCall?.body).toEqual({
        baseCurrency: 'BTC',
        quoteCurrency: 'EUR',
        paymentMethod: 'creditCard',
        quoteCurrencyAmount: 100,
        walletAddress: 'bc1qtest',
        returnUrl: RETURN_URL,
        partnerOrderIdentifier: 'test-order-id'
      })
    })

    it('does not report a purchase when the user returns', async () => {
      const handler = await approve()
      await handler({
        type: 'ramp',
        direction: 'buy',
        providerId: 'btcdirect',
        path: '',
        query: { orderId: 'test-order-id' },
        uri: RETURN_URL
      })
      expect(onLogEvent).not.toHaveBeenCalled()
    })
  })
})
