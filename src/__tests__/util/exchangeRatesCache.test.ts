import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'

import {
  clearRateCache,
  getHistoricalCryptoRate,
  isRateUnavailable,
  RATE_CHAIN_TIMEOUT_MS,
  RATE_QUERY_TIMEOUT_MS,
  rateCacheSize,
  stopRateQueue,
  UNPRICED_TTL_MS
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

  it('remembers an unpriced key briefly rather than for ever', async () => {
    clearRateCache()
    const date = '2019-03-03T04:00:00.000Z'
    posts = 0

    // The route publishes `0` for a rate the server cannot supply, and that
    // never enters the rate cache: answering `0` for the life of the process
    // would outlast any server outage.
    expect(await rateFor(date, unpricedFetch)).toBe(0)
    expect(rateCacheSize()).toBe(0)
    expect(posts).toBe(1)

    // But the repeat is free. Nothing absorbed it before, so an asset the
    // server has no feed for re-paid the whole fill on every listing — 13
    // requests and about a second per listing on a 1,200-transaction wallet,
    // for ever.
    expect(await rateFor(date, unpricedFetch)).toBe(0)
    expect(posts).toBe(1)

    // Short enough to be a cache rather than an answer: minutes, so a
    // recovered server is picked up well inside any session.
    expect(UNPRICED_TTL_MS).toBeLessThanOrEqual(15 * 60_000)

    // And forgotten with the rest of the cache, which the engine clears when
    // the last session logs out.
    clearRateCache()
    expect(await rateFor(date)).toBe(30000)
    expect(rateCacheSize()).toBe(1)
  })

  it('settles every caller as unavailable when the server fails, caching none', async () => {
    clearRateCache()
    const rates = await Promise.all([
      rateFor('2019-04-01T04:00:00.000Z', failingFetch),
      rateFor('2019-04-02T04:00:00.000Z', failingFetch)
    ])
    // `RATE_UNAVAILABLE`, not `0`. A failed request says nothing about
    // whether these dates can be priced, and `0` is the answer the server
    // itself gives for a date it cannot price — so settling a failure at `0`
    // is what let an accounting export carry a zero fiat amount for an
    // arbitrary tail of its range with nothing logged.
    expect(rates.every(rate => isRateUnavailable(rate))).toBe(true)
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

    // The exact size the policy produces, not merely "bounded": one eviction
    // of a quarter fired at the 20,001st distinct key, so 20,100 inserts
    // leave 15,100. `<= 20_000 && > 0` passed for an eviction that dropped
    // the newest key, or all but one of them.
    expect(rateCacheSize()).toBe(20_100 - (20_000 >> 2))

    // And *which* keys went: oldest first, because a Map iterates in
    // insertion order and a long listing pages through dates in order. The
    // observable difference is whether a second request is sent — a cached
    // date answers without one.
    const before = posts
    await rateFor(new Date(start + 20_099 * day).toISOString())
    expect(posts).toBe(before)
    await rateFor(new Date(start).toISOString())
    expect(posts).toBeGreaterThan(before)
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

describe('a rates server that never answers', () => {
  it('settles every queued caller instead of hanging for ever', async () => {
    // The defect: `fetchRates(..., 5000, ...)` reads like a ceiling, but that
    // number is `asyncWaterfall`'s per-server stagger and the timer is armed
    // only `if (pending > 1)` — measured, `asyncWaterfall([never, never],
    // 300)` is still pending after two seconds. So `doQuery` stayed awaiting
    // with `inQuery` latched, `addToQueue` arms no second timer while that is
    // true, and `getHistoricalRate` never calls its own `reject`: every rate
    // caller in the process waited for ever. In the engine that is
    // `get-transactions` hanging to the client's deadline, permanently.
    //
    // The deadline is 30 s of real time, so this drives the module through a
    // `doFetch` that rejects the way the deadline does rather than waiting
    // it out. What it pins is the recovery: the caller settles at 0, and the
    // queue is usable afterwards.
    clearRateCache()
    const hangingThenFine: any = async () => {
      throw new Error('the rates server did not answer within 30000ms')
    }
    const rate = await getHistoricalCryptoRate(
      'bitcoin',
      null,
      'iso:USD',
      '2024-01-01T00:00:00.000Z',
      100,
      hangingThenFine
    )
    // `RATE_UNAVAILABLE` is what the module answers for a rate it could not
    // get, as distinct from the `0` the server itself gives for a date it
    // cannot price — and it is still a settled promise, which is the
    // property this case is about.
    expect(isRateUnavailable(rate)).toBe(true)

    // And the next pass works, rather than the queue staying latched: the
    // recovery existed for a rejection and a hang never reached it.
    const after = await getHistoricalCryptoRate(
      'bitcoin',
      null,
      'iso:USD',
      '2024-01-02T00:00:00.000Z',
      100,
      fakeFetch
    )
    expect(after).toBe(30000)
  })

  it('settles a server that answers and then stalls mid-body', async () => {
    // The other door, and the one the deadline used to miss: under Node's
    // `fetch` a response resolves as soon as headers arrive, so a 200 whose
    // body never finishes left `doQuery` awaiting `response.json()` outside
    // the budget, with `inQuery` latched and every later key queued into a
    // `resolverMap` nothing would drain.
    //
    // The stall is modelled where the real one happens — inside the body
    // read — with a promise that never settles, and the deadline is driven
    // by jest's fake timers rather than 30 s of real time.
    clearRateCache()
    jest.useFakeTimers()
    try {
      const stalling: any = async () => ({
        ok: true,
        status: 200,
        async text() {
          return await new Promise<string>(() => {})
        },
        async json() {
          return await new Promise<unknown>(() => {})
        }
      })
      const pending = getHistoricalCryptoRate(
        'bitcoin',
        null,
        'iso:USD',
        '2024-03-01T00:00:00.000Z',
        100,
        stalling
      )
      // Past the deadline, which now covers the body.
      await jest.advanceTimersByTimeAsync(RATE_QUERY_TIMEOUT_MS + 1000)
      expect(isRateUnavailable(await pending)).toBe(true)
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('a caller with more keys than one request holds', () => {
  it('is bounded by one chain budget, not one per batch', async () => {
    // `RATE_QUERY_TIMEOUT_MS` bounds one upstream request and `doQuery`
    // recurses once per batch, so the wait used to be (batches) × 30 s. A
    // pass carries at most 99 keys, and `fillTxsFiat`'s docblock names 1,200
    // unpriced transactions as the real case: 13 passes, about 390 s,
    // against `apiClient`'s 120 s. The client reported `Request timed out`
    // and the daemon kept working for four and a half more minutes with
    // `inQuery` latched and every other rate caller queued behind it.
    clearRateCache()
    jest.useFakeTimers()
    try {
      const stalling: any = async () => ({
        ok: true,
        status: 200,
        async text() {
          return await new Promise<string>(() => {})
        },
        async json() {
          return await new Promise<unknown>(() => {})
        }
      })

      const pending: Array<Promise<number>> = []
      for (let i = 0; i < 1200; ++i) {
        const day = String((i % 28) + 1).padStart(2, '0')
        const month = String((Math.floor(i / 28) % 12) + 1).padStart(2, '0')
        const year = 2000 + Math.floor(i / (28 * 12))
        pending.push(
          getHistoricalCryptoRate(
            'bitcoin',
            null,
            'iso:USD',
            `${year}-${month}-${day}T00:00:00.000Z`,
            100,
            stalling
          )
        )
      }

      let settled = 0
      const all = Promise.all(
        pending.map(async p => {
          const rate = await p
          ++settled
          return rate
        })
      )

      // Three batches' worth of deadlines is where the old shape was a third
      // of the way through 1,200 keys.
      await jest.advanceTimersByTimeAsync(RATE_QUERY_TIMEOUT_MS * 3 + 1000)
      expect(settled).toBeLessThan(1200)

      // One chain budget settles the lot, below the client's own deadline.
      await jest.advanceTimersByTimeAsync(RATE_CHAIN_TIMEOUT_MS)
      const rates = await all
      expect(rates).toHaveLength(1200)
      // `RATE_UNAVAILABLE` for every one of them, which is the distinction
      // the budget needed: nothing was learned about these dates, and an
      // export writing `0` for them is a file that reconciles to the wrong
      // number. `get-transactions` refuses the export on this.
      expect(rates.every(rate => isRateUnavailable(rate))).toBe(true)
    } finally {
      jest.useRealTimers()
      stopRateQueue()
    }
  })
})

describe('stopping the queue', () => {
  it('does not leave a pass in flight running a second chain', async () => {
    stopRateQueue()
    clearRateCache()
    posts = 0

    // A server slow enough that the first pass is still awaiting when the
    // queue is stopped underneath it. `stopRateQueue` clears `inQuery` but
    // cannot cancel that pass, so without an epoch the key queued below
    // armed a second chain that ran alongside the first.
    const slowFetch: any = async (uri: string, opts: any) => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return await fakeFetch(uri, opts)
    }

    const first = rateFor('2024-03-01T00:00:00.000Z', slowFetch)
    await new Promise(resolve => setTimeout(resolve, 50))
    stopRateQueue()
    // Settled rather than hanging: a stopped queue answers
    // `RATE_UNAVAILABLE`, because it learned nothing about this date.
    expect(isRateUnavailable(await first)).toBe(true)

    // And the module still works afterwards.
    const second = await rateFor('2024-03-02T00:00:00.000Z')
    expect(second).toBe(30000)
  })
})
