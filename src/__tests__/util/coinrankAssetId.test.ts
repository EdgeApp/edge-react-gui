import { describe, expect, it } from '@jest/globals'

import { getCoinrankAssetId } from '../../util/coinrankAssetId'

const coins = {
  BTC: 'bitcoin',
  EURR: 'stablr-euro',
  USDC: 'usd-coin'
}

describe('getCoinrankAssetId', () => {
  it('resolves a mainnet asset by ticker', () => {
    expect(getCoinrankAssetId(coins, 'bitcoin', null, 'BTC')).toBe('bitcoin')
  })

  it('resolves a token by ticker', () => {
    expect(
      getCoinrankAssetId(
        coins,
        'ethereum',
        'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        'USDC'
      )
    ).toBe('usd-coin')
  })

  it('returns undefined for a ticker the list does not hold', () => {
    expect(
      getCoinrankAssetId(coins, 'ethereum', 'abc123', 'NOPE')
    ).toBeUndefined()
  })

  it('does not resolve Revolut Euro to the StablR Euro chart', () => {
    expect(
      getCoinrankAssetId(
        coins,
        'ethereum',
        '8e9c32a536ab623a2e0e9961bce6f5fe7504e084',
        'EURR'
      )
    ).toBeUndefined()
    expect(
      getCoinrankAssetId(
        coins,
        'polygon',
        '11b20f798b70df2201d8f550addcc3378b33dd4a',
        'EURR'
      )
    ).toBeUndefined()
  })

  it('still resolves a different contract using the same ticker', () => {
    expect(
      getCoinrankAssetId(
        coins,
        'ethereum',
        '50753cfaf86c094925bf976f218d043f8791e408',
        'EURR'
      )
    ).toBe('stablr-euro')
  })
})
