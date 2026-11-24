import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import {
  fetchDfxSellCryptoAmount,
  fetchDfxSellFiatAmount
} from '../../../plugins/ramps/dfx/dfxQuote'
import {
  installFakeFetch,
  makeTextResponse
} from '../../../util/fake/fakeFetch'

let fakeFetch: ReturnType<typeof installFakeFetch>
let assetStatus = 200
let quoteStatus = 200
let quoteAmount = 0.003502
let quoteEstimate = 199.876
const realWarn = console.warn

const params = {
  blockchain: 'Bitcoin',
  asset: 'BTC',
  fiat: 'EUR',
  fiatAmount: '200'
}

beforeEach(() => {
  assetStatus = 200
  quoteStatus = 200
  quoteAmount = 0.003502
  quoteEstimate = 199.876
  console.warn = jest.fn()
  fakeFetch = installFakeFetch(({ url }) => {
    if (url.includes('/asset?')) {
      return makeTextResponse(assetStatus, [
        { id: 7, name: 'WBTC', blockchain: 'Bitcoin' },
        { id: 113, name: 'BTC', blockchain: 'Bitcoin' }
      ])
    }
    if (url.endsWith('/fiat')) {
      return makeTextResponse(200, [
        { id: 1, name: 'CHF' },
        { id: 2, name: 'EUR' }
      ])
    }
    return makeTextResponse(quoteStatus, {
      amount: quoteAmount,
      estimatedAmount: quoteEstimate
    })
  })
})

afterEach(() => {
  fakeFetch.restore()
  console.warn = realWarn
})

describe('fetchDfxSellCryptoAmount', () => {
  it('quotes the fiat amount with the DFX asset and fiat ids', async () => {
    expect(await fetchDfxSellCryptoAmount(params)).toBe('0.003502')

    expect(fakeFetch.calls).toContainEqual({
      url: 'https://api.dfx.swiss/v1/asset?blockchains=Bitcoin'
    })
    expect(fakeFetch.calls).toContainEqual({
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

  it('gives up when DFX does not trade the fiat', async () => {
    expect(
      await fetchDfxSellCryptoAmount({ ...params, fiat: 'USD' })
    ).toBeUndefined()
    expect(console.warn).toHaveBeenCalled()
  })

  it('gives up when the asset list fails', async () => {
    assetStatus = 500

    expect(await fetchDfxSellCryptoAmount(params)).toBeUndefined()
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

  it('gives up when DFX does not answer in time', async () => {
    jest.useFakeTimers()
    try {
      fakeFetch.restore()
      fakeFetch = installFakeFetch(
        async () => await new Promise<Response>(() => {})
      )

      const pending = fetchDfxSellCryptoAmount(params)
      await jest.advanceTimersByTimeAsync(10000)

      expect(await pending).toBeUndefined()
      expect(console.warn).toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('fetchDfxSellFiatAmount', () => {
  const fiatParams = {
    blockchain: 'Bitcoin',
    asset: 'BTC',
    fiat: 'EUR',
    cryptoAmount: '0.0035'
  }

  it('quotes the crypto amount with the DFX asset and fiat ids', async () => {
    expect(await fetchDfxSellFiatAmount(fiatParams)).toBe('199.88')

    expect(fakeFetch.calls).toContainEqual({
      url: 'https://api.dfx.swiss/v1/asset?blockchains=Bitcoin'
    })
    expect(fakeFetch.calls).toContainEqual({
      url: 'https://api.dfx.swiss/v1/sell/quote',
      method: 'PUT',
      body: { asset: { id: 113 }, currency: { id: 2 }, amount: 0.0035 }
    })
  })

  it('writes a whole estimate without decimals', async () => {
    quoteEstimate = 200

    expect(await fetchDfxSellFiatAmount(fiatParams)).toBe('200')
  })

  it('gives up when DFX does not trade the fiat', async () => {
    expect(
      await fetchDfxSellFiatAmount({ ...fiatParams, fiat: 'USD' })
    ).toBeUndefined()
    expect(console.warn).toHaveBeenCalled()
  })

  it('gives up when the quote fails', async () => {
    quoteStatus = 400

    expect(await fetchDfxSellFiatAmount(fiatParams)).toBeUndefined()
  })

  it('gives up on an estimate that is not positive', async () => {
    quoteEstimate = -1

    expect(await fetchDfxSellFiatAmount(fiatParams)).toBeUndefined()
  })

  it('gives up on an estimate that rounds to zero', async () => {
    quoteEstimate = 0.004

    expect(await fetchDfxSellFiatAmount(fiatParams)).toBeUndefined()
  })

  it('gives up when DFX does not answer in time', async () => {
    jest.useFakeTimers()
    try {
      fakeFetch.restore()
      fakeFetch = installFakeFetch(
        async () => await new Promise<Response>(() => {})
      )

      const pending = fetchDfxSellFiatAmount(fiatParams)
      await jest.advanceTimersByTimeAsync(10000)

      expect(await pending).toBeUndefined()
      expect(console.warn).toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })
})
