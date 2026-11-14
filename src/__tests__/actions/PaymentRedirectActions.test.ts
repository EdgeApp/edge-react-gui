import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { launchDeepLink } from '../../actions/DeepLinkingActions'
import { Airship } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { pluginMaps } from '../../pluginMaps'
import type { DeepLink } from '../../types/DeepLinkTypes'

const OWN_EXTERNAL_ID = 'own-external-id'
const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

const realFetch = global.fetch
const realMoonpay = pluginMaps.rampPlugins.moonpay
afterEach(() => {
  global.fetch = realFetch
  pluginMaps.rampPlugins.moonpay = realMoonpay
  jest.restoreAllMocks()
})

interface FakeWalletOpts {
  currencyCode?: string
  multiplier?: string
  /** What the wallet's recent transaction list holds. */
  transactions?: unknown[]
  allTokens?: Record<string, unknown>
}

// The fakes hold only the fields the handler reads, far short of the core
// types:
const makeWallet = (pluginId: string, opts: FakeWalletOpts = {}): any => {
  const {
    currencyCode = 'ETH',
    multiplier = '1000000000000000000',
    transactions = [],
    allTokens = {}
  } = opts
  const currencyInfo = {
    pluginId,
    currencyCode,
    denominations: [{ name: currencyCode, multiplier }]
  }
  const currencyConfig = { currencyInfo, allTokens }
  return {
    id: pluginId,
    currencyInfo,
    currencyConfig,
    enabledTokenIds: Object.keys(allTokens),
    saveTxAction: jest.fn(async () => {}),
    streamTransactions: jest.fn(() => {
      let sent = false
      return {
        next: async () => {
          if (sent) return { done: true, value: undefined }
          sent = true
          return { done: false, value: transactions }
        },
        return: async () => ({ done: true, value: undefined })
      }
    })
  }
}

/** A logged-in account holding these wallets, which opened one sell order. */
const makeState = (wallets: any[]): any => {
  const currencyWallets: Record<string, any> = {}
  const currencyConfig: Record<string, any> = {}
  for (const wallet of wallets) {
    currencyWallets[wallet.id] = wallet
    currencyConfig[wallet.id] = wallet.currencyConfig
  }
  const account = {
    loggedIn: true,
    activeWalletIds: Object.keys(currencyWallets),
    currencyWallets,
    currencyWalletErrors: {},
    currencyConfig,
    dataStore: {
      getItem: async (storeId: string, itemId: string) => {
        if (storeId === 'moonpay-sell-orders' && itemId === OWN_EXTERNAL_ID) {
          return '{}'
        }
        throw new Error(`No item ${itemId}`)
      }
    },
    watch: () => () => {}
  }
  return {
    core: { account, context: { clientId: '1111111111111111' } },
    ui: { settings: { defaultIsoFiat: 'iso:USD' } }
  }
}

interface FakeOrder {
  status?: string
  baseCurrencyAmount?: number
  code?: string
  networkCode?: string
  contractAddress?: string | null
  walletAddress?: string
  walletAddressTag?: string
  externalTransactionId?: string | null
}

const makeOrder = (order: FakeOrder = {}): unknown => ({
  status: order.status ?? 'waitingForDeposit',
  externalTransactionId:
    order.externalTransactionId === undefined
      ? OWN_EXTERNAL_ID
      : order.externalTransactionId,
  baseCurrencyAmount: order.baseCurrencyAmount ?? 0.0001,
  baseCurrency: {
    code: order.code ?? 'eth_arbitrum',
    metadata: {
      contractAddress: order.contractAddress ?? null,
      networkCode: order.networkCode ?? 'arbitrum'
    }
  },
  quoteCurrencyAmount: 0.25,
  quoteCurrency: { code: 'usd' },
  depositWallet: {
    walletAddress: order.walletAddress ?? '0xOrderDeposit',
    walletAddressTag: order.walletAddressTag ?? ''
  }
})

/** Answer every order lookup, and report how many were made. */
const mockFetch = (status: number, body: unknown): jest.Mock => {
  const mock = jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  }))
  global.fetch = mock as unknown as typeof fetch
  return mock
}

/** Swallow every modal, and report the titles of the notices among them. */
const spyNotices = (): string[] => {
  const titles: string[] = []
  jest.spyOn(Airship, 'show').mockImplementation(async (render: any) => {
    const element = render({ resolve: () => {}, on: () => () => {} })
    if (typeof element?.props?.title === 'string') {
      titles.push(element.props.title)
    }
    return undefined
  })
  return titles
}

const ethLink: DeepLink = {
  type: 'paymentRedirect',
  currencyCode: 'eth',
  depositAddress: '0xLinkAddress',
  amount: '5',
  asset: { pluginId: 'ethereum', tokenId: null },
  transactionId: 'order-1'
}

const follow = async (state: any, link: DeepLink = ethLink): Promise<any> => {
  pluginMaps.rampPlugins.moonpay = {
    apiKey: 'pk_test',
    sellWidgetUrl: 'https://sell.moonpay.test'
  }
  const navigation: any = { push: jest.fn() }
  const dispatch: any = jest.fn(async () => {})
  await launchDeepLink(navigation, link)(dispatch, () => state)
  return navigation
}

describe('launchDeepLink paymentRedirect', () => {
  it('sends what the order says, not what the link says', async () => {
    const state = makeState([makeWallet('arbitrum'), makeWallet('ethereum')])
    mockFetch(200, makeOrder())
    const notices = spyNotices()

    const navigation = await follow(state)

    expect(notices).toEqual([])
    expect(navigation.push).toHaveBeenCalledWith(
      'send2',
      expect.objectContaining({
        walletId: 'arbitrum',
        tokenId: null,
        lockTilesMap: { address: true, amount: true, wallet: true },
        spendInfo: expect.objectContaining({
          tokenId: null,
          assetAction: { assetActionType: 'sell' },
          savedAction: expect.objectContaining({
            actionType: 'fiat',
            orderId: 'order-1'
          }),
          spendTargets: [
            { publicAddress: '0xOrderDeposit', nativeAmount: '100000000000000' }
          ],
          memos: undefined
        })
      })
    )
  })

  it('opens no Send for a closed order', async () => {
    const state = makeState([makeWallet('arbitrum')])
    mockFetch(200, makeOrder({ status: 'failed' }))
    const notices = spyNotices()

    const navigation = await follow(state)

    expect(navigation.push).not.toHaveBeenCalled()
    expect(notices).toEqual([lstrings.payment_redirect_order_closed_title])
  })

  it('tells a paid order apart from a closed one', async () => {
    const state = makeState([makeWallet('arbitrum')])
    mockFetch(200, makeOrder({ status: 'completed' }))
    const notices = spyNotices()

    const navigation = await follow(state)

    expect(navigation.push).not.toHaveBeenCalled()
    expect(notices).toEqual([lstrings.payment_redirect_order_paid_title])
  })

  it('opens no Send for an unknown order', async () => {
    const state = makeState([makeWallet('arbitrum')])
    mockFetch(404, { message: 'Transaction not found' })
    const notices = spyNotices()

    const navigation = await follow(state)

    expect(navigation.push).not.toHaveBeenCalled()
    expect(notices).toEqual([lstrings.payment_redirect_unverified_title])
  })

  it('opens no Send for an order this account did not open', async () => {
    const state = makeState([makeWallet('arbitrum')])
    mockFetch(200, makeOrder({ externalTransactionId: 'someone-elses-id' }))
    const notices = spyNotices()

    const navigation = await follow(state)

    expect(navigation.push).not.toHaveBeenCalled()
    expect(notices).toEqual([lstrings.payment_redirect_not_owned_title])
  })

  it('looks nothing up for a link from another provider', async () => {
    const state = makeState([makeWallet('arbitrum')])
    const fetchMock = mockFetch(200, makeOrder())
    const notices = spyNotices()

    const navigation = await follow(state, { ...ethLink, providerId: 'other' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(navigation.push).not.toHaveBeenCalled()
    expect(notices).toEqual([lstrings.payment_redirect_unverified_title])
  })

  it('opens no second Send once the wallet holds the deposit', async () => {
    const deposit = {
      txid: 'deposit-txid',
      savedAction: { actionType: 'fiat', orderId: 'order-1' }
    }
    const arbitrum = makeWallet('arbitrum', { transactions: [deposit] })
    const state = makeState([arbitrum])
    // MoonPay has not seen the deposit yet:
    mockFetch(200, makeOrder())
    const notices = spyNotices()

    const navigation = await follow(state)

    expect(arbitrum.streamTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ tokenId: null })
    )
    expect(navigation.push).not.toHaveBeenCalled()
    expect(notices).toEqual([lstrings.payment_redirect_order_paid_title])
  })

  it('carries the order destination tag as an XRP memo', async () => {
    const ripple = makeWallet('ripple', {
      currencyCode: 'XRP',
      multiplier: '1000000'
    })
    const state = makeState([ripple])
    mockFetch(
      200,
      makeOrder({
        code: 'xrp',
        networkCode: 'ripple',
        baseCurrencyAmount: 12.5,
        walletAddress: 'rOrderDeposit',
        walletAddressTag: '123456'
      })
    )
    spyNotices()

    const navigation = await follow(state, {
      type: 'paymentRedirect',
      currencyCode: 'xrp',
      depositAddress: 'rLinkAddress',
      addressTag: '999',
      transactionId: 'order-1'
    })

    expect(navigation.push).toHaveBeenCalledWith(
      'send2',
      expect.objectContaining({
        walletId: 'ripple',
        spendInfo: expect.objectContaining({
          spendTargets: [
            { publicAddress: 'rOrderDeposit', nativeAmount: '12500000' }
          ],
          memos: [
            {
              type: 'number',
              memoName: 'destination tag',
              value: '123456',
              hidden: true
            }
          ]
        })
      })
    )
  })

  it('saves the sell action on a token deposit once it is sent', async () => {
    const ethereum = makeWallet('ethereum', {
      allTokens: {
        [USDC_TOKEN_ID]: {
          currencyCode: 'USDC',
          displayName: 'USD Coin',
          denominations: [{ name: 'USDC', multiplier: '1000000' }],
          networkLocation: { contractAddress: USDC_CONTRACT }
        }
      }
    })
    const state = makeState([ethereum])
    mockFetch(
      200,
      makeOrder({
        code: 'usdc',
        networkCode: 'ethereum',
        contractAddress: USDC_CONTRACT,
        baseCurrencyAmount: 25
      })
    )
    spyNotices()

    const navigation = await follow(state, {
      type: 'paymentRedirect',
      currencyCode: 'usdc',
      depositAddress: '0xLinkAddress',
      transactionId: 'order-1'
    })

    expect(navigation.push).toHaveBeenCalledWith(
      'send2',
      expect.objectContaining({
        walletId: 'ethereum',
        tokenId: USDC_TOKEN_ID,
        spendInfo: expect.objectContaining({
          tokenId: USDC_TOKEN_ID,
          spendTargets: [
            { publicAddress: '0xOrderDeposit', nativeAmount: '25000000' }
          ]
        })
      })
    )

    const [, params] = navigation.push.mock.calls[0]
    const edgeTransaction = { txid: 'deposit-txid' }
    await params.onDone(undefined, edgeTransaction)

    expect(ethereum.saveTxAction).toHaveBeenCalledWith({
      txid: 'deposit-txid',
      tokenId: USDC_TOKEN_ID,
      assetAction: { assetActionType: 'sell' },
      savedAction: params.spendInfo.savedAction
    })
    expect(navigation.push).toHaveBeenLastCalledWith('transactionDetails', {
      edgeTransaction,
      walletId: 'ethereum'
    })
  })
})
