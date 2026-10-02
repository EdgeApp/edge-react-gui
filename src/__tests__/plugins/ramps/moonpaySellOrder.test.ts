import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import {
  fetchMoonpaySellOrder,
  makeMoonpaySellAction,
  type MoonpayOpenSellOrder
} from '../../../plugins/ramps/moonpay/moonpaySellOrder'

const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

// Only the parts of an account the lookup reads:
const fakeAccount = {
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
}

const makeOrder = (order: FakeOrder = {}): unknown => ({
  id: 'order-1',
  status: order.status ?? 'waitingForDeposit',
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

  it('reports an order that no longer takes a deposit', async () => {
    for (const status of ['failed', 'completed', 'pending']) {
      mockFetch(200, makeOrder({ status }))
      expect(await fetchMoonpaySellOrder(fakeAccount, 'order-1', opts)).toEqual(
        { type: 'notOpen', status }
      )
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
