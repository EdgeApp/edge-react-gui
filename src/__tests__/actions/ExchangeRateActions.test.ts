import { describe, expect, it } from '@jest/globals'

import {
  convertToRatesParams,
  type ExchangeRateCache,
  mergePairCache
} from '../../actions/ExchangeRateActions'

type PairCache = ReturnType<typeof mergePairCache>

const PAIR_EXPIRATION = 5000
const rateEntry = {
  current: 1,
  yesterday: 1,
  yesterdayTimestamp: 0,
  expiration: 0
}

const noRates: ExchangeRateCache = { crypto: {}, fiat: {} }
const emptyCache: PairCache = { cryptoPairs: [], fiatPairs: [] }

describe('mergePairCache', () => {
  it('collapses a pair stored without a tokenId and one stored with null', () => {
    // Older cache entries were written without a `tokenId` key at all, so they
    // read back as undefined, while newer ones carry an explicit null. Both
    // mean "the chain's own asset".
    const previous: PairCache = {
      cryptoPairs: [
        {
          asset: { pluginId: 'bitcoin', tokenId: undefined },
          targetFiat: 'iso:USD',
          isoDate: undefined,
          expiration: 1
        },
        {
          asset: { pluginId: 'bitcoin', tokenId: null },
          targetFiat: 'iso:USD',
          isoDate: undefined,
          expiration: 1
        }
      ],
      fiatPairs: []
    }

    const out = mergePairCache(noRates, previous, PAIR_EXPIRATION)

    expect(out.cryptoPairs).toHaveLength(1)
  })

  it('does not append a duplicate for a chain asset already cached', () => {
    const previous: PairCache = {
      cryptoPairs: [
        // Written with no tokenId key, so it reads back off disk as undefined:
        {
          asset: { pluginId: 'bitcoin', tokenId: undefined },
          targetFiat: 'iso:USD',
          isoDate: undefined,
          expiration: 1
        }
      ],
      fiatPairs: []
    }
    const rates: ExchangeRateCache = {
      crypto: { bitcoin: { '': { 'iso:USD': rateEntry } } },
      fiat: {}
    }

    const out = mergePairCache(rates, previous, PAIR_EXPIRATION)

    expect(out.cryptoPairs).toHaveLength(1)
    expect(out.cryptoPairs[0].asset.tokenId).toBeNull()
    expect(out.cryptoPairs[0].expiration).toBe(PAIR_EXPIRATION)
  })

  it('stays stable across repeated merges', () => {
    const rates: ExchangeRateCache = {
      crypto: { bitcoin: { '': { 'iso:USD': rateEntry } } },
      fiat: { 'iso:EUR': { 'iso:USD': rateEntry } }
    }

    let cache = emptyCache
    for (let i = 0; i < 5; i++) {
      cache = mergePairCache(rates, cache, PAIR_EXPIRATION)
    }

    expect(cache.cryptoPairs).toHaveLength(1)
    expect(cache.fiatPairs).toHaveLength(1)
  })

  it('keeps tokens separate from their chain asset', () => {
    const rates: ExchangeRateCache = {
      crypto: {
        ethereum: {
          '': { 'iso:USD': rateEntry },
          a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48: { 'iso:USD': rateEntry }
        }
      },
      fiat: {}
    }

    const out = mergePairCache(rates, emptyCache, PAIR_EXPIRATION)

    const tokenIds = out.cryptoPairs.map(pair => pair.asset.tokenId)
    expect(tokenIds).toHaveLength(2)
    expect(tokenIds).toContain(null)
    expect(tokenIds).toContain('a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
  })

  it('keeps the same asset against different target fiats separate', () => {
    const rates: ExchangeRateCache = {
      crypto: {
        bitcoin: { '': { 'iso:USD': rateEntry, 'iso:EUR': rateEntry } }
      },
      fiat: {}
    }

    const out = mergePairCache(rates, emptyCache, PAIR_EXPIRATION)

    expect(out.cryptoPairs).toHaveLength(2)
  })
})

describe('convertToRatesParams', () => {
  it('omits isoDate for current pairs but keeps it for historical pairs', () => {
    // A device with a fast clock used to stamp "current" pairs with a future
    // timestamp, which the rates server answers with no rate. Current pairs
    // must go out with no isoDate so the server uses its own clock.
    const cryptoPairs = new Map([
      [
        'current',
        {
          asset: { pluginId: 'bitcoin', tokenId: null },
          targetFiat: 'iso:USD',
          isoDate: undefined,
          expiration: PAIR_EXPIRATION
        }
      ],
      [
        'historical',
        {
          asset: { pluginId: 'bitcoin', tokenId: null },
          targetFiat: 'iso:USD',
          isoDate: '2026-08-12T13:00:00.000Z',
          expiration: PAIR_EXPIRATION
        }
      ]
    ])
    const fiatPairs = new Map([
      [
        'current',
        {
          fiatCode: 'iso:USD',
          targetFiat: 'iso:USD',
          isoDate: undefined,
          expiration: PAIR_EXPIRATION
        }
      ]
    ])

    const requests = convertToRatesParams(cryptoPairs, fiatPairs)
    expect(requests).toHaveLength(1)
    const [request] = requests

    const current = request.crypto.find(entry => entry.isoDate == null)
    const historical = request.crypto.find(entry => entry.isoDate != null)
    expect(current).toBeDefined()
    expect(current?.isoDate).toBeUndefined()
    expect(historical?.isoDate?.toISOString()).toBe('2026-08-12T13:00:00.000Z')
    expect(request.fiat[0].isoDate).toBeUndefined()

    // On the wire an undefined isoDate drops out entirely, so the server falls
    // back to its own clock; the historical date is still sent.
    const wireCrypto: Array<Record<string, unknown>> = JSON.parse(
      JSON.stringify(request)
    ).crypto
    const wireCurrent = wireCrypto.find(entry => entry.isoDate == null)
    expect(Object.prototype.hasOwnProperty.call(wireCurrent, 'isoDate')).toBe(
      false
    )
  })
})
