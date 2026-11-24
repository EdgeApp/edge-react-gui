import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import URL from 'url-parse'

import type { SendScene2Params } from '../../../components/scenes/SendScene2'
import {
  showError,
  showToast
} from '../../../components/services/AirshipInstance'
import { requestPermissionOnSettings } from '../../../components/services/PermissionsManager'
import type { FiatPluginOpenWebViewParams } from '../../../plugins/gui/scenes/FiatPluginWebView'
import {
  openDfxSell,
  parseDfxSellRedirect
} from '../../../plugins/ramps/dfx/dfxSell'
import type {
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'
import type { GuiPlugin } from '../../../types/GuiPluginTypes'
import {
  installFakeFetch,
  makeTextResponse
} from '../../../util/fake/fakeFetch'

jest.mock('../../../components/services/AirshipInstance', () => ({
  showError: jest.fn(),
  showToast: jest.fn()
}))
jest.mock('../../../components/services/PermissionsManager', () => ({
  requestPermissionOnSettings: jest.fn(async () => false)
}))

const REDIRECT_URI = 'https://deep.edge.app/redirect/payment/dfx/bitcoin/'
const CHAIN = { blockchain: 'Bitcoin', asset: 'BTC' }

// The query DFX's sell page redirects with once the user confirms:
const ORDER_QUERY: Record<string, string> = {
  routeId: '42',
  amount: '0.0015',
  asset: 'BTC',
  blockchain: 'Bitcoin',
  isComplete: 'false'
}

const GUI_PLUGIN: GuiPlugin = {
  pluginId: 'dfx',
  storeId: 'dfx',
  baseUri: 'https://app.dfx.swiss',
  displayName: 'DFX'
} as unknown as GuiPlugin

const DEEP_QUERY = {
  wallet: 'Edge',
  lang: 'en',
  blockchain: 'Bitcoin',
  'asset-in': 'BTC',
  'asset-out': 'CHF',
  'amount-in': '0.0015',
  session: 'jwt'
}

/** DFX's sell redirect, `sell` appended to the redirect URI. */
const makeSellRedirect = (query: Record<string, string>): string =>
  `${REDIRECT_URI}sell?${new URLSearchParams(query).toString()}`

describe('parseDfxSellRedirect', () => {
  const parse = (
    query: Record<string, string>
  ): ReturnType<typeof parseDfxSellRedirect> =>
    parseDfxSellRedirect(makeSellRedirect(query), REDIRECT_URI, CHAIN)

  it('reads the order DFX redirects with', () => {
    expect(parse(ORDER_QUERY)).toEqual({
      routeId: '42',
      amount: '0.0015',
      isComplete: false
    })
  })

  it('reads an order DFX reports as sent', () => {
    expect(parse({ ...ORDER_QUERY, isComplete: 'true' })).toEqual({
      routeId: '42',
      amount: '0.0015',
      isComplete: true
    })
  })

  it('reads no order from the cancel redirect', () => {
    expect(
      parseDfxSellRedirect(REDIRECT_URI, REDIRECT_URI, CHAIN)
    ).toBeUndefined()
  })

  const refusals: Array<[string, Record<string, string>, string]> = [
    ['another blockchain', { blockchain: 'Ethereum' }, 'not Bitcoin'],
    ['another asset', { asset: 'ETH' }, 'not BTC'],
    ['a route id that is not all digits', { routeId: '42/../7' }, 'routeId'],
    ['an amount in exponent form', { amount: '1e-7' }, 'amount'],
    ['a zero amount', { amount: '0.0' }, 'amount'],
    ['a negative amount', { amount: '-1' }, 'amount']
  ]
  it.each(refusals)('refuses %s', (name, change, message) => {
    expect(() => parse({ ...ORDER_QUERY, ...change })).toThrow(message)
  })

  it.each(Object.keys(ORDER_QUERY))('refuses an order without %s', key => {
    const query = Object.fromEntries(
      Object.entries(ORDER_QUERY).filter(([name]) => name !== key)
    )
    expect(() => parse(query)).toThrow(TypeError)
  })
})

describe('openDfxSell', () => {
  const navigate = jest.fn((route: string, params: unknown) => {})
  // Popping the widget closes its WebView, as the scene's beforeRemove does:
  const pop = jest.fn(() => {
    const webViews = paramsFor<FiatPluginOpenWebViewParams>('guiPluginWebView')
    webViews[webViews.length - 1]?.onClose()
  })
  const broadcastTx = jest.fn(async (tx: EdgeTransaction) => tx)
  const onLogEvent = jest.fn()

  const wallet = {
    id: 'wallet-id',
    currencyInfo: { pluginId: 'bitcoin' },
    currencyConfig: {
      currencyInfo: {
        pluginId: 'bitcoin',
        currencyCode: 'BTC',
        denominations: [{ name: 'BTC', multiplier: '100000000' }]
      },
      allTokens: {}
    },
    broadcastTx
  } as unknown as EdgeCurrencyWallet
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const signedTx = { txid: 'txid' } as EdgeTransaction

  const request: RampQuoteRequest = {
    wallet,
    tokenId: null,
    displayCurrencyCode: 'BTC',
    amountQuery: { exchangeAmount: '100' },
    fiatCurrencyCode: 'iso:CHF',
    amountType: 'fiat',
    direction: 'sell',
    regionCode: { countryCode: 'CH' }
  }

  let fakeFetch: ReturnType<typeof installFakeFetch>
  let fetchInits: Array<RequestInit | undefined> = []
  let routeBody: unknown
  let routeLoaded: Promise<void> = Promise.resolve()

  const paramsFor = <T>(route: string): T[] =>
    navigate.mock.calls
      .filter(([name]) => name === route)
      .map(([, params]) => params as T)

  /** Lets the pending route fetch and navigation settle. */
  const settle = async (): Promise<void> => {
    for (let i = 0; i < 10; ++i) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  /** Opens the sell and returns the widget's WebView params. */
  const openWidget = async (): Promise<FiatPluginOpenWebViewParams> => {
    await openDfxSell({
      config: {
        navigation: { navigate, pop },
        onLogEvent,
        disklet: {}
      } as unknown as RampPluginConfig,
      guiPlugin: GUI_PLUGIN,
      deepPath: '/sell',
      deepQuery: DEEP_QUERY,
      request,
      chain: CHAIN
    })
    const webViews = paramsFor<FiatPluginOpenWebViewParams>('guiPluginWebView')
    expect(webViews).toHaveLength(1)
    return webViews[0]
  }

  beforeEach(() => {
    routeBody = {
      id: 42,
      deposit: {
        id: 7,
        address: 'bc1deposit',
        blockchain: 'Bitcoin',
        blockchains: ['Bitcoin']
      }
    }
    routeLoaded = Promise.resolve()
    fakeFetch = installFakeFetch(async () => {
      await routeLoaded
      return makeTextResponse(200, routeBody)
    })
    // The fake fetch does not record headers, which carry the session:
    const fetchRoute = global.fetch
    fetchInits = []
    global.fetch = (async (input: string, init?: RequestInit) => {
      fetchInits.push(init)
      return await fetchRoute(input, init)
    }) as typeof global.fetch
    // The route fetch settles on real timers:
    jest.useRealTimers()
  })

  afterEach(() => {
    fakeFetch.restore()
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  it('opens DFX with the payment redirect and the unchanged query', async () => {
    const webView = await openWidget()

    const url = new URL(webView.url, true)
    expect(`${url.origin}${url.pathname}`).toBe('https://app.dfx.swiss/sell')
    expect(url.query).toEqual({ ...DEEP_QUERY, 'redirect-uri': REDIRECT_URI })
  })

  it('opens nothing when the user denies the camera', async () => {
    jest.mocked(requestPermissionOnSettings).mockResolvedValueOnce(true)

    await openDfxSell({
      config: {
        navigation: { navigate, pop },
        onLogEvent,
        disklet: {}
      } as unknown as RampPluginConfig,
      guiPlugin: GUI_PLUGIN,
      deepPath: '/sell',
      deepQuery: DEEP_QUERY,
      request,
      chain: CHAIN
    })

    expect(navigate).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledTimes(1)
  })

  it('closes the widget once on the cancel redirect', async () => {
    const webView = await openWidget()

    expect(webView.onShouldStartLoad?.(REDIRECT_URI)).toBe(false)
    await webView.onUrlChange?.(REDIRECT_URI)
    await settle()

    expect(pop).toHaveBeenCalledTimes(1)
    expect(paramsFor('send2')).toHaveLength(0)
    expect(fakeFetch.calls).toHaveLength(0)
  })

  it('opens nothing for an order DFX reports as sent', async () => {
    const webView = await openWidget()

    webView.onShouldStartLoad?.(
      makeSellRedirect({ ...ORDER_QUERY, isComplete: 'true' })
    )
    await settle()

    expect(paramsFor('send2')).toHaveLength(0)
    expect(fakeFetch.calls).toHaveLength(0)
    expect(pop).not.toHaveBeenCalled()
  })

  it('refuses an order for another blockchain before fetching anything', async () => {
    const webView = await openWidget()

    webView.onShouldStartLoad?.(
      makeSellRedirect({ ...ORDER_QUERY, blockchain: 'Ethereum' })
    )
    await settle()

    expect(showError).toHaveBeenCalledTimes(1)
    expect(paramsFor('send2')).toHaveLength(0)
    expect(fakeFetch.calls).toHaveLength(0)
  })

  it('opens the send scene with the deposit address from the route', async () => {
    const webView = await openWidget()

    const redirect = makeSellRedirect(ORDER_QUERY)
    expect(webView.onShouldStartLoad?.(redirect)).toBe(false)
    await settle()

    expect(fakeFetch.calls.map(call => call.url)).toEqual([
      'https://api.dfx.swiss/v1/sell/42'
    ])
    expect(fetchInits[0]?.headers).toEqual({ Authorization: 'Bearer jwt' })

    const sends = paramsFor<SendScene2Params>('send2')
    expect(sends).toHaveLength(1)
    const [send] = sends
    expect(send.walletId).toBe('wallet-id')
    expect(send.spendInfo?.spendTargets).toEqual([
      { nativeAmount: '150000', publicAddress: 'bc1deposit' }
    ])
    expect(send.lockTilesMap).toEqual({
      address: true,
      amount: true,
      wallet: true
    })
    expect(send.hiddenFeaturesMap).toEqual({ address: true })
    expect(send.spendInfo?.assetAction).toEqual({ assetActionType: 'sell' })
    expect(send.spendInfo?.savedAction).toEqual({
      actionType: 'fiat',
      orderId: '42',
      isEstimate: true,
      fiatPlugin: { providerId: 'dfx', providerDisplayName: 'DFX' },
      payinAddress: 'bc1deposit',
      cryptoAsset: {
        pluginId: 'bitcoin',
        tokenId: null,
        nativeAmount: '150000'
      },
      fiatAsset: { fiatCurrencyCode: 'iso:CHF', fiatAmount: '100' }
    })

    // Back leaves the user on DFX's page for the order:
    send.onBack?.()
    await settle()
    expect(pop).not.toHaveBeenCalled()
    expect(showError).not.toHaveBeenCalled()
  })

  it('rounds an amount with more decimals than the asset has down', async () => {
    const webView = await openWidget()

    webView.onShouldStartLoad?.(
      makeSellRedirect({ ...ORDER_QUERY, amount: '0.123456789' })
    )
    await settle()

    const [send] = paramsFor<SendScene2Params>('send2')
    expect(send.spendInfo?.spendTargets[0].nativeAmount).toBe('12345678')
  })

  it('opens the send scene once for several reports of one redirect', async () => {
    const webView = await openWidget()
    const redirect = makeSellRedirect(ORDER_QUERY)

    webView.onShouldStartLoad?.(redirect)
    webView.onShouldStartLoad?.(redirect)
    await webView.onUrlChange?.(redirect)
    await webView.onUrlChange?.(redirect)
    await settle()

    expect(paramsFor('send2')).toHaveLength(1)
    expect(fakeFetch.calls).toHaveLength(1)
  })

  it('refuses a route without a deposit address', async () => {
    routeBody = { id: 42 }
    const webView = await openWidget()

    webView.onShouldStartLoad?.(makeSellRedirect(ORDER_QUERY))
    await settle()

    expect(paramsFor('send2')).toHaveLength(0)
    expect(showError).toHaveBeenCalledTimes(1)
  })

  it('refuses a route that takes deposits on another blockchain', async () => {
    routeBody = {
      id: 42,
      deposit: {
        id: 7,
        address: '0xdeposit',
        blockchain: 'Ethereum',
        blockchains: ['Ethereum']
      }
    }
    const webView = await openWidget()

    webView.onShouldStartLoad?.(makeSellRedirect(ORDER_QUERY))
    await settle()

    expect(paramsFor('send2')).toHaveLength(0)
    expect(showError).toHaveBeenCalledTimes(1)
  })

  it('opens nothing when the user leaves the widget during the route fetch', async () => {
    let releaseRoute = (): void => {}
    routeLoaded = new Promise<void>(resolve => {
      releaseRoute = resolve
    })
    const webView = await openWidget()

    webView.onShouldStartLoad?.(makeSellRedirect(ORDER_QUERY))
    await settle()
    webView.onClose()
    releaseRoute()
    await settle()

    expect(paramsFor('send2')).toHaveLength(0)
    expect(pop).not.toHaveBeenCalled()
    expect(showError).not.toHaveBeenCalled()
  })

  it('closes the widget and reports the sale once the send goes out', async () => {
    const webView = await openWidget()

    webView.onShouldStartLoad?.(makeSellRedirect(ORDER_QUERY))
    await settle()
    const [send] = paramsFor<SendScene2Params>('send2')
    const tx = await send.alternateBroadcast?.(signedTx)
    // The send scene pops itself before it reports the transaction:
    send.onBack?.()
    await send.onDone?.(null, tx)
    await settle()

    expect(broadcastTx).toHaveBeenCalledWith(signedTx)
    expect(pop).toHaveBeenCalledTimes(1)
    expect(onLogEvent).toHaveBeenCalledWith('Sell_Success', {
      conversionValues: expect.objectContaining({
        conversionType: 'sell',
        destFiatCurrencyCode: 'iso:CHF',
        destFiatAmount: '100',
        fiatProviderId: 'dfx',
        orderId: '42'
      })
    })
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(showError).not.toHaveBeenCalled()
  })

  it('shows a toast when the send scene sends nothing', async () => {
    const webView = await openWidget()

    webView.onShouldStartLoad?.(makeSellRedirect(ORDER_QUERY))
    await settle()
    const [send] = paramsFor<SendScene2Params>('send2')
    await send.onDone?.(null)
    await settle()

    expect(pop).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(showError).not.toHaveBeenCalled()
  })
})
