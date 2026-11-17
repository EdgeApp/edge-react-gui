import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import { fetchDfxSellCryptoAmount } from '../../../plugins/ramps/dfx/dfxQuote'

interface FetchCall {
  url: string
  method?: string
  body?: unknown
}

let fetchCalls: FetchCall[] = []
let quoteStatus = 200
let quoteAmount = 0.003502
const realFetch = global.fetch
const realWarn = console.warn

const textResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  } as unknown as Response)

const params = {
  blockchain: 'Bitcoin',
  asset: 'BTC',
  fiat: 'EUR',
  fiatAmount: '200'
}

beforeEach(() => {
  fetchCalls = []
  quoteStatus = 200
  quoteAmount = 0.003502
  console.warn = jest.fn()
  global.fetch = (async (input: unknown, init?: RequestInit) => {
    const url = String(input)
    const body =
      init?.body == null ? undefined : JSON.parse(init.body as string)
    fetchCalls.push({ url, method: init?.method, body })
    if (url.includes('/asset?')) {
      return textResponse(200, [
        { id: 7, name: 'WBTC', blockchain: 'Bitcoin' },
        { id: 113, name: 'BTC', blockchain: 'Bitcoin' }
      ])
    }
    if (url.endsWith('/fiat')) {
      return textResponse(200, [
        { id: 1, name: 'CHF' },
        { id: 2, name: 'EUR' }
      ])
    }
    return textResponse(quoteStatus, { amount: quoteAmount })
  }) as typeof fetch
})

afterEach(() => {
  global.fetch = realFetch
  console.warn = realWarn
})

describe('fetchDfxSellCryptoAmount', () => {
  it('quotes the fiat amount with the DFX asset and fiat ids', async () => {
    expect(await fetchDfxSellCryptoAmount(params)).toBe('0.003502')

    expect(fetchCalls).toContainEqual({
      url: 'https://api.dfx.swiss/v1/sell/quote',
      method: 'PUT',
      body: { asset: { id: 113 }, currency: { id: 2 }, targetAmount: 200 }
    })
  })

  it('writes small amounts as plain decimals', async () => {
    quoteAmount = 1e-7

    expect(await fetchDfxSellCryptoAmount(params)).toBe('0.0000001')
  })

  it('gives up when DFX does not trade the asset', async () => {
    expect(
      await fetchDfxSellCryptoAmount({ ...params, asset: 'ETH' })
    ).toBeUndefined()
    expect(console.warn).toHaveBeenCalled()
  })

  it('gives up when the quote fails', async () => {
    quoteStatus = 400

    expect(await fetchDfxSellCryptoAmount(params)).toBeUndefined()
  })

  it('gives up on an empty quote', async () => {
    quoteAmount = 0

    expect(await fetchDfxSellCryptoAmount(params)).toBeUndefined()
  })
})
