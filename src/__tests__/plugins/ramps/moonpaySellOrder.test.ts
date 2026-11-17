import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import {
  fetchMoonpaySellOrder,
  makeMoonpayExternalTransactionId,
  makeMoonpaySellAction,
  type MoonpayOpenSellOrder
} from '../../../plugins/ramps/moonpay/moonpaySellOrder'
import { createStore } from '../../../plugins/ramps/utils/createStore'
import { getRampPluginStoreId } from '../../../plugins/ramps/utils/rampStoreIds'

const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

const OWN_EXTERNAL_ID = 'own-external-id'

/** Where both MoonPay sell flows keep the ids, as `storeId/itemId`. */
const savedKey = (externalTransactionId: string): string =>
  `com.moonpay/sellOrder:${externalTransactionId}`

/** A synced dataStore that holds only what was saved to it. */
const makeDataStore = (
  saved: string[] = []
): { items: Map<string, string>; store: EdgeAccount['dataStore'] } => {
  const items = new Map<string, string>(saved.map(id => [savedKey(id), '{}']))
  const store = {
    getItem: async (storeId: string, itemId: string) => {
      const item = items.get(`${storeId}/${itemId}`)
      if (item == null) throw new Error(`No item ${itemId}`)
      return item
    },
    setItem: async (storeId: string, itemId: string, value: string) => {
      items.set(`${storeId}/${itemId}`, value)
    }
  } as unknown as EdgeAccount['dataStore']
  return { items, store }
}

// Only the parts of an account the lookup reads:
const fakeAccount = {
  dataStore: makeDataStore([OWN_EXTERNAL_ID]).store,
  sync: async () => {},
  currencyConfig: {
    arbitrum: { allTokens: {} },
    base: { allTokens: {} },
    bitcoin: { allTokens: {} },
    ethereum: {
      allTokens: {
        [USDC_TOKEN_ID]: {
          networkLocation: { contractAddress: USDC_CONTRACT.toLowerCase() }
        }
      }
    },
    ripple: { allTokens: {} }
  }
} as unknown as EdgeAccount

const opts = { apiKey: 'pk_test_key', apiUrl: 'https://api.moonpay.test' }
const realFetch = global.fetch

interface FakeOrder {
  status?: string
  baseCurrencyAmount?: number
  code?: string
  networkCode?: string
  contractAddress?: string | null
  walletAddress?: string
  walletAddressTag?: string | null
  externalTransactionId?: string | null
}

const makeOrder = (order: FakeOrder = {}): unknown => ({
  id: 'order-1',
  status: order.status ?? 'waitingForDeposit',
  externalTransactionId:
    order.externalTransactionId === undefined
      ? OWN_EXTERNAL_ID
      : order.externalTransactionId,
  baseCurrencyAmount: order.baseCurrencyAmount ?? 0.5,
  baseCurrency: {
    code: order.code ?? 'eth_arbitrum',
    metadata: {
      contractAddress:
        order.contractAddress === undefined ? null : order.contractAddress,
      networkCode: order.networkCode ?? 'arbitrum'
    }
  },
  quoteCurrencyAmount: 1234.5,
  quoteCurrency: { code: 'usd' },
  depositWallet: {
    walletAddress: order.walletAddress ?? '0xOrderDepositAddress',
    walletAddressTag:
      order.walletAddressTag === undefined ? '' : order.walletAddressTag
  }
})

/** Answer the next lookup, and report the URLs that were fetched. */
const mockFetch = (status: number, body: unknown): string[] => {
  const urls: string[] = []
  global.fetch = jest.fn(async (url: unknown) => {
    urls.push(String(url))
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body
    }
  }) as unknown as typeof fetch
  return urls
}

describe('fetchMoonpaySellOrder', () => {
  afterEach(() => {
    global.fetch = realFetch
  })

  it('reads an open order from the sell_transactions endpoint', async () => {
    const urls = mockFetch(200, makeOrder())

    const result = await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)

    expect(urls).toEqual([
      'https://api.moonpay.test/v3/sell_transactions/order-1?apiKey=pk_test_key'
    ])
    expect(result).toEqual({
      type: 'open',
      status: 'waitingForDeposit',
      asset: { pluginId: 'arbitrum', tokenId: null },
      depositAddress: '0xOrderDepositAddress',
      addressTag: undefined,
      exchangeAmount: '0.5',
      fiatAmount: '1234.5',
      fiatCurrencyCode: 'USD'
    })
  })

  it('pins ETH to the network MoonPay names, not the ticker', async () => {
    mockFetch(200, makeOrder({ code: 'eth_base', networkCode: 'base' }))

    const result = await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)

    expect(result).toMatchObject({
      type: 'open',
      asset: { pluginId: 'base', tokenId: null }
    })
  })

  it('treats the burn address as the native asset', async () => {
    mockFetch(
      200,
      makeOrder({
        contractAddress: '0x0000000000000000000000000000000000000000'
      })
    )

    const result = await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)

    expect(result).toMatchObject({
      type: 'open',
      asset: { pluginId: 'arbitrum', tokenId: null }
    })
  })

  it('resolves a token by its contract address', async () => {
    mockFetch(
      200,
      makeOrder({
        code: 'usdc',
        networkCode: 'ethereum',
        contractAddress: USDC_CONTRACT
      })
    )

    const result = await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)

    expect(result).toMatchObject({
      type: 'open',
      asset: { pluginId: 'ethereum', tokenId: USDC_TOKEN_ID }
    })
  })

  it('carries a destination tag and drops a blank one', async () => {
    mockFetch(
      200,
      makeOrder({
        code: 'xrp',
        networkCode: 'ripple',
        walletAddress: 'rOrderDeposit',
        walletAddressTag: '123456'
      })
    )
    expect(
      await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)
    ).toMatchObject({
      type: 'open',
      asset: { pluginId: 'ripple', tokenId: null },
      depositAddress: 'rOrderDeposit',
      addressTag: '123456'
    })

    mockFetch(200, makeOrder({ walletAddressTag: null }))
    const untagged = await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)
    expect(untagged).toMatchObject({ type: 'open' })
    expect(untagged).toHaveProperty('addressTag', undefined)
  })

  it('keeps a tiny amount readable as a decimal', async () => {
    mockFetch(
      200,
      makeOrder({
        code: 'btc',
        networkCode: 'bitcoin',
        baseCurrencyAmount: 0.00212
      })
    )

    const result = await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)

    expect(result).toMatchObject({ type: 'open', exchangeAmount: '0.00212' })
  })

  it('tells a paid order apart from a closed one', async () => {
    for (const status of ['completed', 'pending']) {
      mockFetch(200, makeOrder({ status }))
      expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual(
        { type: 'paid', status }
      )
    }

    for (const status of ['failed', 'someNewStatus']) {
      mockFetch(200, makeOrder({ status }))
      expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual(
        { type: 'notOpen', status }
      )
    }
  })

  it('refuses an order this account did not open', async () => {
    // Another account's order, or one opened before the id was sent:
    for (const externalTransactionId of ['someone-elses-id', null, '']) {
      mockFetch(200, makeOrder({ externalTransactionId }))
      expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual(
        { type: 'error', reason: 'notOwned' }
      )
    }

    // A closed order is refused before its status is reported:
    mockFetch(
      200,
      makeOrder({ status: 'completed', externalTransactionId: 'other' })
    )
    expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual({
      type: 'error',
      reason: 'notOwned'
    })
  })

  it('accepts the order a saved id was sent with', async () => {
    const { items, store } = makeDataStore()
    const account: EdgeAccount = { ...fakeAccount, dataStore: store }
    // The store both sell flows are handed for MoonPay:
    const pluginStore = createStore(getRampPluginStoreId('moonpay'), store)

    const externalTransactionId = await makeMoonpayExternalTransactionId(
      pluginStore
    )

    expect(externalTransactionId).toMatch(/^[0-9a-f-]{36}$/)
    expect([...items.keys()]).toEqual([savedKey(externalTransactionId)])
    mockFetch(200, makeOrder({ externalTransactionId }))
    expect(await fetchMoonpaySellOrder(account, 'order-1', opts)).toMatchObject(
      { type: 'open' }
    )
    expect(await makeMoonpayExternalTransactionId(pluginStore)).not.toBe(
      externalTransactionId
    )
  })

  it('syncs once to find an id saved on another device', async () => {
    const { items, store } = makeDataStore()
    // The other device's save arrives with the next sync:
    const sync = jest.fn(async () => {
      items.set(savedKey('other-device-id'), '{}')
    })
    const account = { ...fakeAccount, dataStore: store, sync }

    mockFetch(200, makeOrder({ externalTransactionId: 'other-device-id' }))
    expect(await fetchMoonpaySellOrder(account, 'order-1', opts)).toMatchObject(
      { type: 'open' }
    )
    expect(sync).toHaveBeenCalledTimes(1)

    // An id already on this device needs no sync:
    sync.mockClear()
    expect(await fetchMoonpaySellOrder(account, 'order-1', opts)).toMatchObject(
      { type: 'open' }
    )
    expect(sync).not.toHaveBeenCalled()
  })

  it('refuses an order still unknown after a sync', async () => {
    const sync = jest.fn(async () => {})
    mockFetch(200, makeOrder({ externalTransactionId: 'someone-elses-id' }))
    expect(
      await fetchMoonpaySellOrder({ ...fakeAccount, sync }, 'order-1', opts)
    ).toEqual({ type: 'error', reason: 'notOwned' })
    expect(sync).toHaveBeenCalledTimes(1)
  })

  it('reports a failed lookup when the sync fails or stalls', async () => {
    mockFetch(200, makeOrder({ externalTransactionId: 'someone-elses-id' }))
    const failingSync = async (): Promise<void> => {
      throw new Error('offline')
    }
    expect(
      await fetchMoonpaySellOrder(
        { ...fakeAccount, sync: failingSync },
        'order-1',
        opts
      )
    ).toEqual({ type: 'error', reason: 'lookupFailed' })

    jest.useFakeTimers()
    try {
      const stalledSync = async (): Promise<void> => {
        await new Promise<void>(() => {})
      }
      const result = fetchMoonpaySellOrder(
        { ...fakeAccount, sync: stalledSync },
        'order-1',
        opts
      )
      await jest.advanceTimersByTimeAsync(10000)
      expect(await result).toEqual({ type: 'error', reason: 'lookupFailed' })
    } finally {
      jest.useRealTimers()
    }
  })

  it('reports an unknown order id', async () => {
    mockFetch(404, { message: 'Transaction not found', type: 'NotFoundError' })

    expect(await fetchMoonpaySellOrder(fakeAccount, 'nope', opts)).toEqual({
      type: 'error',
      reason: 'notFound'
    })
  })

  it('reports a failed lookup instead of throwing', async () => {
    mockFetch(500, {})
    expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual({
      type: 'error',
      reason: 'lookupFailed'
    })

    mockFetch(200, { unexpected: 'shape' })
    expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual({
      type: 'error',
      reason: 'lookupFailed'
    })

    global.fetch = jest.fn(async () => {
      throw new Error('Network request failed')
    }) as unknown as typeof fetch
    expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual({
      type: 'error',
      reason: 'lookupFailed'
    })
  })

  it('refuses an open order with no deposit address or amount', async () => {
    mockFetch(200, makeOrder({ walletAddress: ' ' }))
    expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual({
      type: 'error',
      reason: 'lookupFailed'
    })

    mockFetch(200, makeOrder({ baseCurrencyAmount: 0 }))
    expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual({
      type: 'error',
      reason: 'lookupFailed'
    })
  })

  it('refuses an asset Edge cannot pin to one network', async () => {
    // A network Edge has no mapping for:
    mockFetch(200, makeOrder({ networkCode: 'some_new_chain' }))
    expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual({
      type: 'error',
      reason: 'unknownAsset'
    })

    // A mapped network whose plugin this account does not have:
    mockFetch(200, makeOrder({ code: 'sol', networkCode: 'solana' }))
    expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual({
      type: 'error',
      reason: 'unknownAsset'
    })

    // A contract that matches no token on the network:
    mockFetch(
      200,
      makeOrder({
        networkCode: 'ethereum',
        contractAddress: '0x1111111111111111111111111111111111111111'
      })
    )
    expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual({
      type: 'error',
      reason: 'unknownAsset'
    })
  })
})

describe('makeMoonpaySellAction', () => {
  const openOrder: MoonpayOpenSellOrder = {
    type: 'open',
    status: 'waitingForDeposit',
    asset: { pluginId: 'ethereum', tokenId: USDC_TOKEN_ID },
    depositAddress: '0xOrderDepositAddress',
    exchangeAmount: '250',
    fiatAmount: '206.64',
    fiatCurrencyCode: 'USD'
  }
  const params = {
    orderId: 'order-1',
    nativeAmount: '250000000',
    sellWidgetUrl: 'https://sell.moonpay.test'
  }

  it('records the order as an estimated MoonPay sell', () => {
    expect(makeMoonpaySellAction(openOrder, params)).toEqual({
      actionType: 'fiat',
      orderId: 'order-1',
      orderUri:
        'https://sell.moonpay.test/transaction_receipt?transactionId=order-1',
      isEstimate: true,
      fiatPlugin: {
        providerId: 'moonpay',
        providerDisplayName: 'MoonPay',
        supportEmail: 'support@moonpay.com'
      },
      payinAddress: '0xOrderDepositAddress',
      cryptoAsset: {
        pluginId: 'ethereum',
        tokenId: USDC_TOKEN_ID,
        nativeAmount: '250000000'
      },
      fiatAsset: { fiatCurrencyCode: 'iso:USD', fiatAmount: '206.64' }
    })
  })

  it('records nothing for an order with no quote', () => {
    for (const missing of [
      { fiatAmount: undefined },
      { fiatCurrencyCode: undefined },
      { fiatCurrencyCode: '' },
      { fiatAmount: undefined, fiatCurrencyCode: undefined }
    ]) {
      expect(
        makeMoonpaySellAction({ ...openOrder, ...missing }, params)
      ).toBeUndefined()
    }
  })

  it('builds a record from a looked-up order', async () => {
    mockFetch(200, makeOrder())
    const order = await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)
    global.fetch = realFetch
    if (order.type !== 'open') throw new Error('Expected an open order')

    expect(makeMoonpaySellAction(order, params)).toMatchObject({
      cryptoAsset: { pluginId: 'arbitrum', tokenId: null },
      fiatAsset: { fiatCurrencyCode: 'iso:USD', fiatAmount: '1234.5' }
    })
  })
})
