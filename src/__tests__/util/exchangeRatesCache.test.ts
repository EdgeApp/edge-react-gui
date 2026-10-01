import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'

import {
  clearRateCache,
  getHistoricalCryptoRate,
  rateCacheSize,
  stopRateQueue
} from '../../util/exchangeRates'

// Real timers: the queue debounces by FETCH_FREQUENCY before it fetches.
// The injected `doFetch` below is the only thing keeping this suite off
// `rates.edge.app` — `fetchRates` falls back to the real fetch without it, so
// a case added with no fake goes to the network.
beforeAll(() => {
  jest.useRealTimers()
})
afterAll(() => {
  // The debounce is `unref`ed, but an armed timer in a shared worker still
  // hides the next real leak.
  stopRateQueue()
  jest.useFakeTimers()
})

/** A rates server that prices everything it is asked for. */
let posts = 0
const fakeFetch: any = async (_uri: string, opts: any) => {
  posts++
  const body = JSON.parse(opts.body)
  return {
    ok: true,
    status: 200,
    json: async () => ({
      targetFiat: body.targetFiat,
      crypto: body.crypto.map((c: any) => ({ ...c, rate: 30000 })),
      fiat: body.fiat.map((f: any) => ({ ...f, rate: 1 }))
    }),
    text: async () => ''
  }
}

/** A rates server that answers, but prices nothing it was asked for. */
const unpricedFetch: any = async (_uri: string, opts: any) => {
  posts++
  const body = JSON.parse(opts.body)
  return {
    ok: true,
    status: 200,
    json: async () => ({
      targetFiat: body.targetFiat,
      crypto: body.crypto.map((c: any) => ({ ...c, rate: undefined })),
      fiat: body.fiat.map((f: any) => ({ ...f, rate: undefined }))
    }),
    text: async () => ''
  }
}

/** A rates server that is down. */
const failingFetch: any = async () => {
  posts++
  return {
    ok: false,
    status: 503,
    json: async () => ({}),
    text: async () => 'rates server unavailable'
  }
}

const rateFor = async (
  date: string,
  doFetch: any = fakeFetch,
  pluginId = 'bitcoin'
): Promise<number> =>
  await getHistoricalCryptoRate(pluginId, null, 'iso:USD', date, 100, doFetch)

describe('the module-level rate cache', () => {
  it('caches a rate, serves it without a second request, and clears', async () => {
    clearRateCache()
    expect(rateCacheSize()).toBe(0)

    const date = '2022-06-01T04:00:00.000Z'
    const first = await rateFor(date)
    expect(first).toBe(30000)
    expect(rateCacheSize()).toBe(1)

    const before = posts
    const second = await rateFor(date)
    expect(second).toBe(30000)
    // Served from the cache: behind a daemon this is what keeps a long
    // listing from re-pricing the same dates.
    expect(posts).toBe(before)

    // And a long-lived process needs to be able to drop it: the engine calls
    // this when the last session goes away and again on shutdown.
    clearRateCache()
    expect(rateCacheSize()).toBe(0)
  })

  it('does not cache a zero, so one unpriced response is not permanent', async () => {
    clearRateCache()
    const date = '2019-03-03T04:00:00.000Z'

    // The route publishes `0` for a rate the server cannot supply.
    expect(await rateFor(date, unpricedFetch)).toBe(0)
    expect(rateCacheSize()).toBe(0)

    // A later pass against a recovered server therefore prices it.
    expect(await rateFor(date)).toBe(30000)
    expect(rateCacheSize()).toBe(1)
  })

  it('resolves every caller with zero when the server fails, caching none', async () => {
    clearRateCache()
    const rates = await Promise.all([
      rateFor('2019-04-01T04:00:00.000Z', failingFetch),
      rateFor('2019-04-02T04:00:00.000Z', failingFetch)
    ])
    expect(rates).toStrictEqual([0, 0])
    expect(rateCacheSize()).toBe(0)
  })

  it('prices a key queued while a request is already in flight', async () => {
    clearRateCache()
    posts = 0

    // `addToQueue` deliberately arms no second timer while a pass is running,
    // so this key joins the queue without a request of its own. Deciding "no
    // progress" from the queue's size made the in-flight pass resolve it as
    // `0` without ever asking the server — a $0 fiat amount in an export and
    // in a transaction-list row.
    let release: (value: unknown) => void = () => {}
    const held = new Promise(resolve => {
      release = resolve
    })
    const slowFetch: any = async (uri: string, opts: any) => {
      await held
      return await fakeFetch(uri, opts)
    }

    const first = rateFor('2020-01-01T04:00:00.000Z', slowFetch)
    // Long enough for the debounce to fire and the fetch to be outstanding.
    await new Promise(resolve => setTimeout(resolve, 1200))
    const second = rateFor('2020-01-02T04:00:00.000Z', fakeFetch)
    const third = rateFor('2020-01-03T04:00:00.000Z', fakeFetch)
    release(undefined)

    expect(await first).toBe(30000)
    expect(await second).toBe(30000)
    expect(await third).toBe(30000)
    // Two passes: the one that was in flight, and one for the arrivals.
    expect(posts).toBe(2)
  })

  it('gives up once on keys the server answered but could not price', async () => {
    clearRateCache()
    posts = 0
    // Without settling an asked-for key the retry would re-send the identical
    // request forever, with no delay.
    expect(await rateFor('2018-07-07T04:00:00.000Z', unpricedFetch)).toBe(0)
    expect(posts).toBe(1)
  })

  it('keeps the cache bounded', async () => {
    clearRateCache()
    // One date per entry, past the 20,000 bound. Dates are a day apart so
    // every key is distinct. They are queued before anything is awaited, so
    // the whole set costs one debounce and then one immediate pass per
    // RATES_SERVER_MAX_QUERY_SIZE batch.
    const start = Date.UTC(2000, 0, 1)
    const day = 86_400_000
    const pending: Array<Promise<number>> = []
    for (let i = 0; i < 20_100; i++) {
      pending.push(rateFor(new Date(start + i * day).toISOString()))
    }
    const rates = await Promise.all(pending)
    expect(rates.every(rate => rate === 30000)).toBe(true)
    expect(rateCacheSize()).toBeLessThanOrEqual(20_000)
    expect(rateCacheSize()).toBeGreaterThan(0)
  }, 120_000)
})

describe('query scheduling', () => {
  it('fires immediately when the queue has been idle', async () => {
    // A trailing-edge debounce spent a full FETCH_FREQUENCY before the first
    // request, and every daemon request starts from an idle queue — so
    // `get-transactions` paid it twice in series, a fixed ~2s floor
    // independent of page size, and ~1s even when every rate was cached.
    stopRateQueue()
    clearRateCache()
    posts = 0

    const started = Date.now()
    await rateFor('2024-01-01T00:00:00.000Z')
    const elapsed = Date.now() - started

    // Well under FETCH_FREQUENCY, which is what the old path could not do.
    expect(elapsed).toBeLessThan(500)
    expect(posts).toBe(1)
  })

  it('still collapses a burst into one request', async () => {
    // The coalescing the GUI's per-row lookups need: the leading edge is
    // deferred by a tick, so everything queued in the same pass goes in one
    // batch rather than one request per caller.
    stopRateQueue()
    clearRateCache()
    posts = 0

    const dates = Array.from(
      { length: 25 },
      (_v, i) => `2024-02-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`
    )
    await Promise.all(dates.map(async date => await rateFor(date)))

    expect(rateCacheSize()).toBe(25)
    expect(posts).toBe(1)
  })
})
