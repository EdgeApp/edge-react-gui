import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { floor, gt, mul } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { FiatProviderError } from '../../../plugins/gui/fiatProviderTypes'
import { paybisRampPlugin } from '../../../plugins/ramps/paybis/paybisRampPlugin'
import type {
  RampPlugin,
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'

interface QuoteBody {
  currencyCodeFrom: string
  currencyCodeTo: string
  amount: string
  directionChange: 'from' | 'to'
  paymentMethod?: string
  payoutMethod?: string
}

interface FakeLimit {
  /** Ceiling Paybis reports in its over-limit error. */
  reported: string
  currencyCode: string
  /** Largest amount actually accepted; defaults to the reported ceiling. */
  accepted?: string
}

const CREDIT_BUY = 'method-id-credit-card'
const CREDIT_SELL = 'method-id-mass-pay-credit-card-out'

let quoteBodies: QuoteBody[] = []
let limit: FakeLimit | undefined
const realFetch = global.fetch

const jsonResponse = (body: unknown): Response =>
  ({
    ok: true,
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as unknown as Response)

const quoteMethod = (body: QuoteBody): object => {
  const amount = { amount: body.amount, currencyCode: 'USD' }
  return {
    id: body.paymentMethod ?? body.payoutMethod,
    amountFrom: { ...amount, currencyCode: body.currencyCodeFrom },
    amountTo: { ...amount, currencyCode: body.currencyCodeTo },
    fees: { networkFee: amount, serviceFee: amount, totalFee: amount },
    expiration: '2030-01-01T00:00:00Z',
    expiresAt: '2030-01-01T00:00:00Z'
  }
}

const quoteResponse = (body: QuoteBody): object => {
  const methodId = body.paymentMethod ?? body.payoutMethod
  const isSell = body.payoutMethod != null
  const base = {
    id: 'quote-id',
    currencyCodeFrom: body.currencyCodeFrom,
    currencyCodeTo: body.currencyCodeTo,
    requestedAmount: {
      amount: body.amount,
      currencyCode:
        body.directionChange === 'from'
          ? body.currencyCodeFrom
          : body.currencyCodeTo
    },
    requestedAmountType: body.directionChange
  }

  let message: string | undefined
  if (methodId !== CREDIT_BUY && methodId !== CREDIT_SELL) {
    message = 'Payment method is not available'
  } else if (
    limit != null &&
    gt(body.amount, limit.accepted ?? limit.reported)
  ) {
    message = `You can buy or sell up to ${limit.reported} ${limit.currencyCode} per order`
  }

  if (message != null) {
    const errors = [
      {
        [isSell ? 'payoutMethod' : 'paymentMethod']: methodId,
        error: { message }
      }
    ]
    return isSell
      ? { ...base, payoutMethodErrors: errors }
      : { ...base, paymentMethodErrors: errors }
  }
  return isSell
    ? { ...base, payoutMethods: [quoteMethod(body)] }
    : { ...base, paymentMethods: [quoteMethod(body)] }
}

const fakeFetch = async (
  url: string,
  options?: { body?: string }
): Promise<Response> => {
  const { pathname } = new URL(url)
  if (pathname.endsWith('/currency/pairs/buy-crypto')) {
    return jsonResponse({
      data: [
        {
          name: CREDIT_BUY,
          pairs: [
            { from: 'USD', to: [{ currency: 'BTC', currencyCode: 'BTC' }] }
          ]
        }
      ]
    })
  }
  if (pathname.endsWith('/currency/pairs/sell-crypto')) {
    return jsonResponse({
      data: [
        { name: CREDIT_SELL, pairs: [{ fromAssetId: 'BTC', to: ['USD'] }] }
      ]
    })
  }
  if (pathname.endsWith('/status')) {
    return jsonResponse({ hasTransactions: true })
  }
  if (pathname.endsWith('/quote')) {
    const body: QuoteBody = JSON.parse(options?.body ?? '{}')
    quoteBodies.push(body)
    return jsonResponse(quoteResponse(body))
  }
  throw new Error(`Unexpected fetch ${url}`)
}

const makePlugin = (): RampPlugin => {
  const config: RampPluginConfig = {
    initOptions: {
      apiKey: 'test-api-key',
      apiUrl: 'https://paybis.test',
      privateKeyB64: 'dGVzdA=='
    },
    store: {
      deleteItem: async () => {},
      listItemIds: async () => [],
      getItem: async () => 'test-user-id',
      setItem: async () => {}
    },
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    account: {} as RampPluginConfig['account'],
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    navigation: {} as RampPluginConfig['navigation'],
    onLogEvent: () => {},
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    disklet: {} as RampPluginConfig['disklet']
  }
  return paybisRampPlugin(config)
}

const makeRequest = (
  overrides: Partial<RampQuoteRequest> & Pick<RampQuoteRequest, 'amountQuery'>
): RampQuoteRequest => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  wallet: { currencyInfo: { pluginId: 'bitcoin' } } as EdgeCurrencyWallet,
  tokenId: null,
  displayCurrencyCode: 'BTC',
  fiatCurrencyCode: 'iso:USD',
  amountType: 'crypto',
  direction: 'sell',
  regionCode: { countryCode: 'US', stateProvinceCode: 'CA' },
  ...overrides
})

/** Unwraps the single FiatProviderError from the plugin's AggregateError. */
const getProviderError = async (
  promise: Promise<unknown>
): Promise<FiatProviderError> => {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e
  )
  expect(error).toBeInstanceOf(AggregateError)
  const providerErrors = (error as AggregateError).errors.filter(
    e => e instanceof FiatProviderError
  )
  expect(providerErrors).toHaveLength(1)
  return providerErrors[0] as FiatProviderError
}

describe('paybisRampPlugin fetchQuotes over-limit handling', () => {
  beforeEach(() => {
    quoteBodies = []
    limit = undefined
    global.fetch = fakeFetch as typeof global.fetch
  })

  afterEach(() => {
    global.fetch = realFetch
  })

  it('re-quotes a sell max below a crypto ceiling', async () => {
    limit = { reported: '0.22910004', currencyCode: 'BTC' }
    const quotes = await makePlugin().fetchQuotes(
      makeRequest({ amountQuery: { maxExchangeAmount: '1.5' } })
    )

    const expected = floor(mul('0.22910004', '0.995'), -8)
    expect(quoteBodies.map(body => body.amount)).toEqual(['1.5', expected])
    expect(quotes).toHaveLength(1)
    expect(quotes[0].cryptoAmount).toBe(expected)
  })

  it('re-quotes a buy max at an exact fiat ceiling', async () => {
    limit = { reported: '5000', currencyCode: 'USD' }
    const quotes = await makePlugin().fetchQuotes(
      makeRequest({
        amountQuery: { max: true },
        amountType: 'fiat',
        direction: 'buy'
      })
    )

    const creditAmounts = quoteBodies
      .filter(body => body.paymentMethod === CREDIT_BUY)
      .map(body => body.amount)
    // credit, applepay, and googlepay all quote through the card method
    expect(creditAmounts).toEqual([
      '10000',
      '5000',
      '10000',
      '5000',
      '10000',
      '5000'
    ])
    const credit = quotes.find(quote => quote.paymentType === 'credit')
    expect(credit?.fiatAmount).toBe('5000')
  })

  it('throws overLimit without retrying when the ceiling is in another currency', async () => {
    limit = { reported: '20000', currencyCode: 'USD', accepted: '1' }
    const error = await getProviderError(
      makePlugin().fetchQuotes(
        makeRequest({ amountQuery: { maxExchangeAmount: '1.5' } })
      )
    )

    expect(error.quoteError).toMatchObject({
      errorType: 'overLimit',
      errorAmount: 20000,
      displayCurrencyCode: 'USD'
    })
    expect(quoteBodies).toHaveLength(1)
  })

  it('throws overLimit on the first attempt for a non-max request', async () => {
    limit = { reported: '0.22910004', currencyCode: 'BTC' }
    const error = await getProviderError(
      makePlugin().fetchQuotes(
        makeRequest({ amountQuery: { exchangeAmount: '1.5' } })
      )
    )

    expect(error.quoteError).toMatchObject({
      errorType: 'overLimit',
      errorAmount: 0.22910004,
      displayCurrencyCode: 'BTC'
    })
    expect(quoteBodies).toHaveLength(1)
  })

  it('throws overLimit when the re-quote is still over the ceiling', async () => {
    limit = { reported: '0.22910004', currencyCode: 'BTC', accepted: '0.2' }
    const error = await getProviderError(
      makePlugin().fetchQuotes(
        makeRequest({ amountQuery: { maxExchangeAmount: '1.5' } })
      )
    )

    expect(error.quoteError.errorType).toBe('overLimit')
    expect(quoteBodies).toHaveLength(2)
  })
})
