import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { banxaRampPlugin } from '../../../plugins/ramps/banxa/banxaRampPlugin'
import type {
  RampPlugin,
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'

jest.mock('../../../components/services/AirshipInstance', () => ({
  ...jest.requireActual<object>('../../../components/services/AirshipInstance'),
  showError: jest.fn(),
  showToast: jest.fn()
}))
jest.mock('../../../components/services/PermissionsManager', () => ({
  ...jest.requireActual<object>(
    '../../../components/services/PermissionsManager'
  ),
  requestPermissionOnSettings: async () => false
}))
jest.mock('../../../util/attestation', () => ({
  attestedJsonHeaders: async () => ({})
}))
jest.mock('../../../util/network', () => ({
  ...jest.requireActual<object>('../../../util/network'),
  fetchInfo: async () => ({
    ok: true,
    json: async () => ({ signature: 'test-signature' })
  })
}))

const VIETQR_ID = 6186
const CREDIT_ID = 7001

const paymentMethods = {
  data: {
    payment_methods: [
      {
        // Field shape from the Banxa payment methods listing:
        id: VIETQR_ID,
        paymentType: 'OSLFCVIETQR',
        name: 'VietQR',
        status: 'ACTIVE',
        type: 'FIAT_TO_CRYPTO',
        supported_fiat: ['VND'],
        supported_coin: ['BTC'],
        transaction_limits: [
          { fiat_code: 'VND', min: '500000', max: '500000000' }
        ]
      },
      {
        // Sells must still quote, so an empty sell result can't pass by accident:
        id: CREDIT_ID,
        paymentType: 'CHECKOUTPO',
        name: 'Card',
        status: 'ACTIVE',
        type: 'CRYPTO_TO_FIAT',
        supported_fiat: ['VND'],
        supported_coin: ['BTC'],
        transaction_limits: [
          { fiat_code: 'VND', min: '500000', max: '500000000' }
        ]
      }
    ]
  }
}

const priceRequests: URLSearchParams[] = []
const realFetch = global.fetch

const jsonResponse = (body: unknown): Response =>
  ({
    ok: true,
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as unknown as Response)

const fakeFetch = async (url: string): Promise<Response> => {
  const { pathname, searchParams } = new URL(url)
  switch (pathname) {
    case '/api/countries':
      return jsonResponse({
        data: { countries: [{ country_code: 'VN' }] }
      })
    case '/api/countries/us/states':
      return jsonResponse({ data: { states: [{ state_code: 'CA' }] } })
    case '/api/coins/buy':
    case '/api/coins/sell':
      return jsonResponse({
        data: {
          coins: [{ coin_code: 'BTC', blockchains: [{ code: 'BTC' }] }]
        }
      })
    case '/api/fiats/buy':
    case '/api/fiats/sell':
      return jsonResponse({ data: { fiats: [{ fiat_code: 'VND' }] } })
    case '/api/payment-methods':
      return jsonResponse(paymentMethods)
    case '/api/prices': {
      priceRequests.push(searchParams)
      return jsonResponse({
        data: {
          spot_price: '2500000000',
          prices: [
            {
              payment_method_id: Number(searchParams.get('payment_method_id')),
              type: 'FIAT_TO_CRYPTO',
              spot_price_fee: '0',
              spot_price_including_fee: '2500000000',
              coin_amount: '0.001',
              coin_code: 'BTC',
              fiat_amount: '2500000',
              fiat_code: 'VND',
              fee_amount: '0',
              network_fee: '0'
            }
          ]
        }
      })
    }
  }
  throw new Error(`Unexpected fetch ${url}`)
}

const makePlugin = (): RampPlugin => {
  const config: RampPluginConfig = {
    initOptions: {
      apiKey: 'test-api-key',
      hmacUser: 'test-hmac-user',
      apiUrl: 'https://banxa.test'
    },
    store: {
      deleteItem: async () => {},
      listItemIds: async () => [],
      getItem: async () => 'test-username',
      setItem: async () => {}
    },

    account: {
      currencyConfig: {
        bitcoin: { allTokens: {}, currencyInfo: { currencyCode: 'BTC' } }
      }
    } as unknown as RampPluginConfig['account'],
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    navigation: {} as RampPluginConfig['navigation'],
    onLogEvent: () => {},
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    disklet: {} as RampPluginConfig['disklet']
  }
  return banxaRampPlugin(config)
}

const makeRequest = (
  direction: RampQuoteRequest['direction']
): RampQuoteRequest => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  wallet: { currencyInfo: { pluginId: 'bitcoin' } } as EdgeCurrencyWallet,
  tokenId: null,
  displayCurrencyCode: 'BTC',
  fiatCurrencyCode: 'iso:VND',
  amountType: 'fiat',
  amountQuery: { exchangeAmount: '2500000' },
  direction,
  regionCode: { countryCode: 'VN' }
})

describe('banxaRampPlugin VietQR', () => {
  beforeEach(() => {
    priceRequests.length = 0
    global.fetch = fakeFetch as typeof global.fetch
  })

  afterEach(() => {
    global.fetch = realFetch
  })

  it('quotes a VND buy with the Banxa VietQR payment method', async () => {
    const quotes = await makePlugin().fetchQuotes(makeRequest('buy'))
    const vietqr = quotes.find(quote => quote.paymentType === 'vietqr')

    expect(vietqr).toMatchObject({
      direction: 'buy',
      fiatAmount: '2500000',
      fiatCurrencyCode: 'iso:VND',
      cryptoAmount: '0.001'
    })
    const vietqrPrice = priceRequests.find(
      params => params.get('payment_method_id') === String(VIETQR_ID)
    )
    expect(vietqrPrice?.get('source')).toBe('VND')
    expect(vietqrPrice?.get('target')).toBe('BTC')
  })

  it('does not quote VietQR on the sell path', async () => {
    const quotes = await makePlugin().fetchQuotes(makeRequest('sell'))

    expect(quotes.map(quote => quote.paymentType)).toEqual(['credit'])
    expect(
      priceRequests.map(params => params.get('payment_method_id'))
    ).toEqual([String(CREDIT_ID)])
  })
})
