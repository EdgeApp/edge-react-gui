import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { floor, gt, mul } from 'biggystring'
import {
  type EdgeCurrencyWallet,
  type EdgeTransaction,
  PendingFundsError
} from 'edge-core-js'

import type { SendScene2Params } from '../../../components/scenes/SendScene2'
import {
  showError,
  showToast
} from '../../../components/services/AirshipInstance'
import { FiatProviderError } from '../../../plugins/gui/fiatProviderTypes'
import { RETURN_URL_PAYMENT } from '../../../plugins/gui/providers/common'
import type { FiatPluginOpenWebViewParams } from '../../../plugins/gui/scenes/FiatPluginWebView'
import { paybisRampPlugin } from '../../../plugins/ramps/paybis/paybisRampPlugin'
import type {
  RampPlugin,
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'

jest.mock('../../../components/services/AirshipInstance', () => ({
  ...jest.requireActual<object>('../../../components/services/AirshipInstance'),
  showError: jest.fn(),
  showToast: jest.fn(),
  showToastSpinner: async (message: string, promise: Promise<unknown>) =>
    await promise
}))
jest.mock('../../../components/services/PermissionsManager', () => ({
  ...jest.requireActual<object>(
    '../../../components/services/PermissionsManager'
  ),
  requestPermissionOnSettings: async () => false
}))
jest.mock('../../../util/crypto', () => ({
  ...jest.requireActual<object>('../../../util/crypto'),
  sha512HashAndSign: () => 'test-signature'
}))

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
  if (pathname.endsWith('/v2/public/request')) {
    return jsonResponse({ requestId: 'request-id', oneTimeToken: 'ott' })
  }
  if (pathname.endsWith('/payment-details')) {
    return jsonResponse({
      assetId: 'BTC',
      blockchain: 'bitcoin',
      network: 'mainnet',
      depositAddress: 'deposit-address',
      currencyCode: 'BTC',
      amount: '0.001'
    })
  }
  throw new Error(`Unexpected fetch ${url}`)
}

const makePlugin = (
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  navigation = {} as RampPluginConfig['navigation'],
  onLogEvent: RampPluginConfig['onLogEvent'] = () => {}
): RampPlugin => {
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
    navigation,
    onLogEvent,
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

describe('paybisRampPlugin sell payment redirect', () => {
  const paymentUrl = `${RETURN_URL_PAYMENT}?requestId=request-id`
  const navigate = jest.fn((route: string, params: unknown) => {})
  const broadcastTx = jest.fn(async (tx: EdgeTransaction) => tx)
  // Popping the widget closes its WebView, as the scene's beforeRemove does:
  const pop = jest.fn(() => {
    const webViews = paramsFor<FiatPluginOpenWebViewParams>('guiPluginWebView')
    webViews[webViews.length - 1]?.onClose()
  })

  const coreWallet = {
    id: 'wallet-id',
    currencyInfo: { pluginId: 'bitcoin' },
    currencyConfig: {
      currencyInfo: {
        pluginId: 'bitcoin',
        denominations: [{ name: 'BTC', multiplier: '100000000' }]
      }
    },
    getReceiveAddress: async () => ({ publicAddress: 'receive-address' }),
    broadcastTx
  } as unknown as EdgeCurrencyWallet
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const signedTx = { txid: 'txid' } as EdgeTransaction

  const paramsFor = <T>(route: string): T[] =>
    navigate.mock.calls
      .filter(([name]) => name === route)
      .map(([, params]) => params as T)

  /** Checks the widget opened again once, for the same order. */
  const expectReopenedOnce = (): FiatPluginOpenWebViewParams => {
    expect(pop).toHaveBeenCalledTimes(1)
    const webViews = paramsFor<FiatPluginOpenWebViewParams>('guiPluginWebView')
    expect(webViews).toHaveLength(2)
    expect(webViews[1].url).toContain('requestId=request-id')
    expect(webViews[1].url).not.toContain('oneTimeToken')
    return webViews[1]
  }

  /** Checks the widget closed once, with no new widget opened. */
  const expectClosedOnce = (): void => {
    expect(pop).toHaveBeenCalledTimes(1)
    expect(paramsFor('guiPluginWebView')).toHaveLength(1)
  }

  /** Lets the plugin's pending fetches and navigation settle. */
  const settle = async (): Promise<void> => {
    for (let i = 0; i < 10; ++i) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  /** Approves a sell quote and returns the widget's WebView params. */
  const openWidget = async (
    onLogEvent?: RampPluginConfig['onLogEvent']
  ): Promise<FiatPluginOpenWebViewParams> => {
    const navigation = {
      navigate,
      pop
    } as unknown as RampPluginConfig['navigation']
    const quotes = await makePlugin(navigation, onLogEvent).fetchQuotes(
      makeRequest({ amountQuery: { exchangeAmount: '0.001' } })
    )
    await quotes[0].approveQuote({ coreWallet })
    const [webView] = paramsFor<FiatPluginOpenWebViewParams>('guiPluginWebView')
    return webView
  }

  beforeEach(() => {
    quoteBodies = []
    limit = undefined
    global.fetch = fakeFetch as typeof global.fetch
    navigate.mockClear()
    pop.mockClear()
    broadcastTx.mockReset()
    broadcastTx.mockImplementation(async (tx: EdgeTransaction) => tx)
    jest.mocked(showError).mockClear()
    jest.mocked(showToast).mockClear()
    // The plugin waits for an animation frame before signing:
    jest.useRealTimers()
  })

  afterEach(() => {
    expect(showError).not.toHaveBeenCalled()
    global.fetch = realFetch
    jest.useFakeTimers()
  })

  it('opens the send scene once for a refused redirect, and Back closes the widget', async () => {
    const webView = await openWidget()
    expect(webView.url).toContain('oneTimeToken=ott')

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    const sends = paramsFor<SendScene2Params>('send2')
    expect(sends).toHaveLength(1)
    expect(sends[0].spendInfo?.spendTargets).toMatchObject([
      { nativeAmount: '100000', publicAddress: 'deposit-address' }
    ])

    sends[0].onBack?.()
    await settle()
    expectClosedOnce()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('closes the widget when the send scene sends nothing', async () => {
    const webView = await openWidget()

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    const [send] = paramsFor<SendScene2Params>('send2')
    await send.onDone?.(null)
    await settle()

    expectClosedOnce()
    expect(showToast).toHaveBeenCalledTimes(1)
  })

  it('opens the send scene once for a redirect that loads anyway', async () => {
    const webView = await openWidget()

    await webView.onUrlChange?.(paymentUrl)
    await webView.onUrlChange?.(paymentUrl)
    await webView.onUrlChange?.(paymentUrl)
    await settle()
    const sends = paramsFor<SendScene2Params>('send2')
    expect(sends).toHaveLength(1)

    // Back closes the widget along with the redirect page:
    sends[0].onBack?.()
    await settle()
    expectClosedOnce()

    // A report from the closed page opens nothing:
    await webView.onUrlChange?.(paymentUrl)
    await settle()
    expect(paramsFor('send2')).toHaveLength(1)
  })

  it('opens the send scene once when the refusal comes too late', async () => {
    const webView = await openWidget()

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await webView.onUrlChange?.(paymentUrl)
    await webView.onUrlChange?.(paymentUrl)
    await settle()
    const sends = paramsFor<SendScene2Params>('send2')
    expect(sends).toHaveLength(1)

    sends[0].onBack?.()
    await settle()
    expectClosedOnce()
  })

  it('opens nothing when the user leaves the widget during the payment-details fetch', async () => {
    const webView = await openWidget()
    let releaseDetails = (): void => {}
    const detailsHeld = new Promise<void>(resolve => {
      releaseDetails = resolve
    })
    global.fetch = (async (url: string, options?: { body?: string }) => {
      if (new URL(url).pathname.endsWith('/payment-details')) {
        await detailsHeld
      }
      return await fakeFetch(url, options)
    }) as typeof global.fetch

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    webView.onClose()
    releaseDetails()
    await settle()

    expect(paramsFor('send2')).toHaveLength(0)
    expect(pop).not.toHaveBeenCalled()
  })

  it('opens nothing when the payment-details fetch fails after the user left the widget', async () => {
    const webView = await openWidget()
    let failDetails = (): void => {}
    const detailsHeld = new Promise<void>((resolve, reject) => {
      failDetails = () => {
        reject(new Error('payment-details failed'))
      }
    })
    global.fetch = (async (url: string, options?: { body?: string }) => {
      if (new URL(url).pathname.endsWith('/payment-details')) {
        await detailsHeld
      }
      return await fakeFetch(url, options)
    }) as typeof global.fetch

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    webView.onClose()
    failDetails()
    await settle()

    expect(paramsFor('send2')).toHaveLength(0)
    expect(pop).not.toHaveBeenCalled()
  })

  it('opens the widget again without the one-time token after a send', async () => {
    const webView = await openWidget()
    expect(webView.url).toContain('oneTimeToken=ott')

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    const [send] = paramsFor<SendScene2Params>('send2')
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    await send.onDone?.(null, { txid: 'txid' } as EdgeTransaction)
    await settle()

    expectReopenedOnce()
  })

  it('finishes the sale when Back follows a broadcast that went through', async () => {
    const onLogEvent = jest.fn()
    const webView = await openWidget(onLogEvent)

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    const [send] = paramsFor<SendScene2Params>('send2')
    // A step after the broadcast fails, so the send scene stays open on its
    // error card and the user leaves with Back:
    await send.alternateBroadcast?.(signedTx)
    send.onBack?.()
    await settle()

    expect(onLogEvent).toHaveBeenCalledWith('Sell_Success', expect.anything())
    expectReopenedOnce()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('opens the widget again when Back follows a broadcast that failed', async () => {
    const webView = await openWidget()
    broadcastTx.mockRejectedValue(new Error('broadcast timed out'))

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    const [send] = paramsFor<SendScene2Params>('send2')
    await expect(send.alternateBroadcast?.(signedTx)).rejects.toThrow(
      'broadcast timed out'
    )
    send.onBack?.()
    await settle()

    expectReopenedOnce()
  })

  it('closes the widget when the wallet refuses the spend', async () => {
    const webView = await openWidget()
    broadcastTx.mockRejectedValue(new PendingFundsError())

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    const [send] = paramsFor<SendScene2Params>('send2')
    await expect(send.alternateBroadcast?.(signedTx)).rejects.toThrow()
    send.onBack?.()
    await settle()

    expectClosedOnce()
  })

  it('refuses a broadcast that comes after Back', async () => {
    const webView = await openWidget()

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    const [send] = paramsFor<SendScene2Params>('send2')
    send.onBack?.()
    await settle()
    await expect(send.alternateBroadcast?.(signedTx)).rejects.toThrow()

    expect(broadcastTx).not.toHaveBeenCalled()
    expectClosedOnce()
  })

  it('opens the widget again when a step after the send throws', async () => {
    const webView = await openWidget(() => {
      throw new Error('log failed')
    })

    expect(webView.onShouldStartLoad?.(paymentUrl)).toBe(false)
    await settle()
    const [send] = paramsFor<SendScene2Params>('send2')
    const tx = await send.alternateBroadcast?.(signedTx)
    await send.onDone?.(null, tx)
    await settle()

    expectReopenedOnce()
    expect(showError).toHaveBeenCalledTimes(1)
    jest.mocked(showError).mockClear()
  })
})
