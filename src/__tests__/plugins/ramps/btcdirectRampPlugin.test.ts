import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { resolvePluginMaps } from '../../../configKeysMerge'
import { FiatProviderError } from '../../../plugins/gui/fiatProviderTypes'
import { btcdirectRampPlugin } from '../../../plugins/ramps/btcdirect/btcdirectRampPlugin'
import type { RampLinkHandler } from '../../../plugins/ramps/rampDeeplinkHandler'
import type {
  RampCheckSupportRequest,
  RampPlugin,
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'
import { getBestQuoteError } from '../../../plugins/ramps/utils/getBestError'
import { openExternalWebView } from '../../../plugins/ramps/utils/webViewUtils'

jest.mock('../../../plugins/ramps/utils/webViewUtils', () => ({
  openExternalWebView: jest.fn(async () => 'deeplink-token')
}))

jest.mock('../../../util/rnUtils', () => ({
  makeUuid: async () => 'test-order-id'
}))

interface FetchCall {
  origin: string
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

const errorResponse = (status: number, text: string): Response =>
  ({
    ok: false,
    status,
    text: async () => text
  } as unknown as Response)

// An expired partner token, as BTC Direct reports it:
const EXPIRED_TOKEN_BODY = JSON.stringify({
  errors: {
    ER801: {
      code: 'ER801',
      message: 'Authorization token is expired.',
      solution: 'Provide a valid authorization token.'
    }
  }
})

/** Answers one endpoint with an error once, then falls back to the fake. */
const failOnce = (endpoint: string, response: Response): void => {
  let failed = false
  global.fetch = (async (url: string, options: FetchOptions = {}) => {
    const { pathname } = new URL(url)
    if (pathname === endpoint && !failed) {
      failed = true
      return response
    }
    return await fakeFetch(url, options)
  }) as typeof global.fetch
}

const rejectionOf = async (promise: Promise<unknown>): Promise<unknown> =>
  await promise.then(
    () => {
      throw new Error('Expected a rejection')
    },
    (error: unknown) => error
  )

const currencyPair = (
  code: string,
  caip19: string | undefined,
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
  const { origin, pathname } = new URL(url)
  const body: Record<string, unknown> =
    options.body == null ? {} : JSON.parse(options.body)
  fetchCalls.push({
    origin,
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
        // The API reference gives an empty string for a missing identifier:
        currencyPair('POL', ''),
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

const makePlugin = (
  initOptions: unknown = {
    username: 'partner',
    password: 'secret',
    apiUrl: 'https://api.btcdirect.test'
  }
): RampPlugin => {
  const config: RampPluginConfig = {
    initOptions,
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

    it('reads its credentials from the split config and keys', async () => {
      // config.json only enables the plugin; keys.json (or the signed
      // remote appKeys overlay) carries the partner credentials:
      const { rampPlugins } = resolvePluginMaps(
        { rampPlugins: { btcdirect: true } },
        {
          rampPlugins: {
            btcdirect: { username: 'partner', password: 'secret' }
          }
        }
      )
      const plugin = makePlugin(rampPlugins.btcdirect)
      await plugin.checkSupport(makeSupportRequest())

      const authCalls = fetchCalls.filter(
        call => call.pathname === '/api/v1/authenticate'
      )
      expect(authCalls).toHaveLength(1)
      expect(authCalls[0].origin).toBe('https://api.btcdirect.eu')
      expect(authCalls[0].body).toEqual({
        username: 'partner',
        password: 'secret'
      })
    })

    it('signs in again when the token is rejected', async () => {
      failOnce(
        '/api/v1/system/currency-pairs',
        errorResponse(400, EXPIRED_TOKEN_BODY)
      )

      const plugin = makePlugin()
      const result = await plugin.checkSupport(makeSupportRequest())

      expect(result.supported).toBe(true)
      const authCalls = fetchCalls.filter(
        call => call.pathname === '/api/v1/authenticate'
      )
      expect(authCalls).toHaveLength(2)
    })

    it('does not sign in again for other bad requests', async () => {
      failOnce(
        '/api/v1/system/currency-pairs',
        errorResponse(400, '{"errors":{"ER100":{"code":"ER100"}}}')
      )

      const plugin = makePlugin()
      const error = await rejectionOf(plugin.checkSupport(makeSupportRequest()))

      expect(String(error)).toContain('400 - {"errors":{"ER100"')
      const authCalls = fetchCalls.filter(
        call => call.pathname === '/api/v1/authenticate'
      )
      expect(authCalls).toHaveLength(1)
    })

    it('retries the provider config after a failed fetch', async () => {
      failOnce(
        '/api/v1/system/currency-pairs',
        errorResponse(503, 'Service Unavailable')
      )

      const plugin = makePlugin()
      await rejectionOf(plugin.checkSupport(makeSupportRequest()))
      expect(await plugin.checkSupport(makeSupportRequest())).toEqual({
        supported: true,
        supportedAmountTypes: ['fiat']
      })
    })

    it('rejects a failed request with its status and body', async () => {
      failOnce(
        '/api/v1/buy/payment-methods/preferred',
        errorResponse(500, 'Internal Server Error')
      )

      const plugin = makePlugin()
      const error = await rejectionOf(plugin.checkSupport(makeSupportRequest()))

      expect(String(error)).toContain(
        'Failed to fetch BTC Direct https://api.btcdirect.test/api/v1/buy/payment-methods/preferred: 500 - Internal Server Error'
      )
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
      const error = await rejectionOf(
        plugin.fetchQuotes(
          makeQuoteRequest({ amountQuery: { exchangeAmount: '10' } })
        )
      )
      if (!(error instanceof AggregateError)) {
        throw new Error('Expected an AggregateError')
      }
      for (const methodError of error.errors) {
        if (!(methodError instanceof FiatProviderError)) {
          throw new Error('Expected a FiatProviderError')
        }
        expect(methodError.quoteError).toEqual({
          providerId: 'btcdirect',
          errorType: 'underLimit',
          errorAmount: 30,
          displayCurrencyCode: 'EUR'
        })
      }
    })

    it.each([
      ['BE', '15000', 'SEPA', '10,000 EUR'],
      ['NL', '60000', 'iDEAL', '50,000 EUR']
    ])(
      'shows the highest limit for an amount over every limit in %s',
      async (countryCode, exchangeAmount, _method, shownLimit) => {
        const plugin = makePlugin()
        const error = await rejectionOf(
          plugin.fetchQuotes(
            makeQuoteRequest({
              amountQuery: { exchangeAmount },
              regionCode: { countryCode }
            })
          )
        )
        if (!(error instanceof AggregateError)) {
          throw new Error('Expected an AggregateError')
        }
        // The buy scene flattens the AggregateError the same way:
        const shown = getBestQuoteError(error.errors, 'EUR', 'buy')
        if (!(shown instanceof Error)) throw new Error('Expected an error')
        expect(shown.message).toContain(shownLimit)
      }
    )
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
