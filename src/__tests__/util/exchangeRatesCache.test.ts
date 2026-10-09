import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'

import {
  clearRateCache,
  configureExchangeRates,
  getHistoricalCryptoRate,
  getHistoricalCryptoRateOrUnavailable,
  getHistoricalFiatRate,
  getHistoricalFiatRateOrUnavailable,
  isRateUnavailable,
  RATE_CHAIN_TIMEOUT_MS,
  RATE_QUERY_TIMEOUT_MS,
  rateCacheSize,
  rateUnpricedCount,
  startRateQueue,
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
  await getHistoricalCryptoRateOrUnavailable(
    pluginId,
    null,
    'iso:USD',
    date,
    100,
    doFetch
  )

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

  it('folds the sentinel to 0 for the plain accessor', async () => {
    // `RATE_UNAVAILABLE` is `NaN`, and the GUI consumers are all written
    // against the `0` this has always answered: `useHistoricalRate` defaults
    // only `undefined`, so `NaN` reached `displayFiatAmount` and
    // `add(NaN, '0')` threw out of `TransactionListRow`'s render, taking the
    // transaction list down whenever the rates server was failing. The
    // Paybis and ramp paths reach biggystring's `mul`/`div` with
    // `String(rate)` and throw the same way. So the sentinel belongs to
    // `…OrUnavailable`, and never leaves the module by any other door.
    clearRateCache()
    const date = '2019-05-01T04:00:00.000Z'
    const sentinel = await getHistoricalCryptoRateOrUnavailable(
      'bitcoin',
      null,
      'iso:USD',
      date,
      100,
      failingFetch
    )
    expect(isRateUnavailable(sentinel)).toBe(true)

    clearRateCache()
    const folded = await getHistoricalCryptoRate(
      'bitcoin',
      null,
      'iso:USD',
      date,
      100,
      failingFetch
    )
    expect(folded).toBe(0)
    expect(Number.isFinite(folded)).toBe(true)
  })

  it('folds the sentinel to 0 for the fiat accessor too', async () => {
    // The other door out of the module, and the one the fold was *not*
    // tested through: deleting `getHistoricalFiatRate`'s own
    // `isRateUnavailable` left the suite green, so the sentinel could leak
    // back out past the fix for the crypto accessor beside it. Same
    // consumers, same crash — `amountQuotePlugin`, `paybisProvider`,
    // `paybisRampPlugin` and `RampCreateScene` all hand the result to
    // biggystring as `String(rate)`.
    clearRateCache()
    const date = '2019-05-02T04:00:00.000Z'
    const sentinel = await getHistoricalFiatRateOrUnavailable(
      'iso:EUR',
      'iso:USD',
      date,
      100,
      failingFetch
    )
    expect(isRateUnavailable(sentinel)).toBe(true)

    clearRateCache()
    const folded = await getHistoricalFiatRate(
      'iso:EUR',
      'iso:USD',
      date,
      100,
      failingFetch
    )
    expect(folded).toBe(0)
    expect(Number.isFinite(folded)).toBe(true)
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
    startRateQueue()
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
    startRateQueue()
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
    const rate = await getHistoricalCryptoRateOrUnavailable(
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
    const after = await getHistoricalCryptoRateOrUnavailable(
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
      const pending = getHistoricalCryptoRateOrUnavailable(
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
          getHistoricalCryptoRateOrUnavailable(
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

      // Two batches' worth of per-request deadlines, which is still inside
      // the callers' own budget: some keys have given up with their request
      // and the rest are still waiting. The old shape needed 13 of these —
      // about 390 s — to reach the end of 1,200 keys.
      await jest.advanceTimersByTimeAsync(RATE_QUERY_TIMEOUT_MS * 2 + 1000)
      expect(settled).toBeLessThan(1200)

      // And every caller's own budget settles the lot, below the client's
      // 120 s deadline. The budget is per key now, not per chain: one
      // caller's spent budget used to settle the whole queue process-wide,
      // whoever had asked.
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

describe('two callers with different budgets', () => {
  it('does not settle a patient caller on an impatient one\u2019s deadline', async () => {
    // The deadline used to live with the *chain*, set by whichever caller
    // armed it and then applied to everything queued when it expired:
    // `settleQueuedAsUnavailable()` emptied the whole map, process-wide,
    // whoever had asked. The engine serves requests concurrently, so
    // `get-transactions --export-format=csv --timeout=600` was refused with
    // `RATES_INCOMPLETE` whenever a `rates-query` (no budget, so 90 s) or a
    // `--timeout=2` armed the chain first — and the error told the operator
    // to raise `--timeout`, which could not help, because their own budget
    // had never been consulted. `--timeout` is the one control the branch
    // offers for "slow is better than wrong".
    clearRateCache()
    startRateQueue()
    jest.useFakeTimers()
    try {
      let calls = 0
      const firstStalls: any = async (uri: string, opts: any) => {
        if (++calls === 1) {
          return {
            ok: true,
            status: 200,
            async text() {
              return await new Promise<string>(() => {})
            },
            async json() {
              return await new Promise<unknown>(() => {})
            }
          }
        }
        return await fakeFetch(uri, opts)
      }

      // The impatient caller arms the chain with a 2 s budget, against a
      // server that never answers.
      const impatient = getHistoricalCryptoRateOrUnavailable(
        'bitcoin',
        null,
        'iso:USD',
        '2024-07-01T00:00:00.000Z',
        100,
        firstStalls,
        2000
      )

      // The patient caller arrives while that pass is in flight, so it is
      // not in the request's own group and its fate is decided by the
      // chain's deadline alone. Ten minutes, like a long `--timeout`.
      await jest.advanceTimersByTimeAsync(50)
      const patient = getHistoricalCryptoRateOrUnavailable(
        'bitcoin',
        null,
        'iso:USD',
        '2024-07-02T00:00:00.000Z',
        100,
        firstStalls,
        600_000
      )

      // Past the impatient budget, the retry debounce and the second
      // request, and nowhere near ten minutes.
      await jest.advanceTimersByTimeAsync(10_000)

      // The impatient caller gets what it asked for: nothing was learned
      // about its date inside the budget it gave.
      expect(isRateUnavailable(await impatient)).toBe(true)
      // And the patient one gets a *price*. It used to be settled
      // `RATE_UNAVAILABLE` by the other caller's expiry, which is the
      // refusal an export could not do anything about.
      expect(await patient).toBe(30000)
    } finally {
      jest.useRealTimers()
      stopRateQueue()
      startRateQueue()
    }
  })
})

describe('a short caller behind a long request', () => {
  it('settles at its own deadline while the pass is still in flight', async () => {
    // The other direction. A key's deadline was only checked when a pass
    // began, and the pass in flight waits for its request — up to
    // `RATE_QUERY_TIMEOUT_MS` — so `--timeout=5` arriving during a
    // `--timeout=600` export's request waited the whole 30 s and timed out
    // at the client instead of answering at 5 s.
    clearRateCache()
    startRateQueue()
    jest.useFakeTimers()
    try {
      const stalls: any = async () => ({
        ok: true,
        status: 200,
        async text() {
          return await new Promise<string>(() => {})
        },
        async json() {
          return await new Promise<unknown>(() => {})
        }
      })

      const patient = getHistoricalCryptoRateOrUnavailable(
        'bitcoin',
        null,
        'iso:USD',
        '2024-08-01T00:00:00.000Z',
        100,
        stalls,
        600_000
      )
      await jest.advanceTimersByTimeAsync(50)

      let settledAt: number | undefined
      const start = Date.now()
      const impatient = getHistoricalCryptoRateOrUnavailable(
        'bitcoin',
        null,
        'iso:USD',
        '2024-08-02T00:00:00.000Z',
        100,
        stalls,
        5000
      ).then(rate => {
        settledAt = Date.now() - start
        return rate
      })

      await jest.advanceTimersByTimeAsync(6000)
      expect(settledAt).toBeDefined()
      expect(settledAt).toBeLessThanOrEqual(5000)
      expect(isRateUnavailable(await impatient)).toBe(true)

      stopRateQueue()
      expect(isRateUnavailable(await patient)).toBe(true)
    } finally {
      jest.useRealTimers()
      stopRateQueue()
      startRateQueue()
    }
  })
})

describe('a large fill', () => {
  it('queues thousands of keys in linear time', async () => {
    // One key per transaction, all queued before anything is awaited. The
    // expiry timer rescanned the whole queue on every enqueue, so a
    // 10,000-key fill spent ~6 s on the JS thread first; 30,000 would be
    // closer to a minute. Linear, it is a couple of seconds even loaded.
    clearRateCache()
    startRateQueue()
    jest.useFakeTimers()
    try {
      const stalls: any = async () => await new Promise(() => {})
      const start = performance.now()
      for (let i = 0; i < 30_000; ++i) {
        getHistoricalCryptoRateOrUnavailable(
          'bitcoin',
          null,
          'iso:USD',
          new Date(Date.UTC(2020, 0, 1) + i * 60_000).toISOString(),
          100,
          stalls,
          600_000
        ).catch(() => {})
      }
      expect(performance.now() - start).toBeLessThan(20_000)
    } finally {
      jest.useRealTimers()
      stopRateQueue()
      startRateQueue()
    }
  }, 60_000)
})

describe('stopping the queue', () => {
  it('does not let a stopped pass answer a key the restarted queue holds', async () => {
    // The epoch was checked once, after the per-group loop, and never after
    // the request a group awaits. So a pass stopped mid-request woke up and
    // settled every key of its group still in `resolverMap` — and after a
    // restart those names belong to *new* callers, who then got the stale
    // pass's answer instead of their own request's.
    stopRateQueue()
    clearRateCache()
    startRateQueue()
    posts = 0
    const date = '2024-08-01T00:00:00.000Z'
    const staleFetch: any = async (uri: string, opts: any) => {
      await new Promise(resolve => setTimeout(resolve, 400))
      return await fakeFetch(uri, opts)
    }
    // A later server that prices the same date differently, and answers
    // after the stale pass has woken.
    const freshFetch: any = async (_uri: string, opts: any) => {
      await new Promise(resolve => setTimeout(resolve, 900))
      const body = JSON.parse(opts.body)
      return {
        ok: true,
        status: 200,
        json: async () => ({
          targetFiat: body.targetFiat,
          crypto: body.crypto.map((c: any) => ({ ...c, rate: 50000 })),
          fiat: body.fiat.map((f: any) => ({ ...f, rate: 1 }))
        }),
        text: async () => ''
      }
    }

    const stale = rateFor(date, staleFetch)
    await new Promise(resolve => setTimeout(resolve, 100))
    stopRateQueue()
    startRateQueue()
    expect(isRateUnavailable(await stale)).toBe(true)

    // The same key, for a new caller, through the restarted queue.
    const fresh = await rateFor(date, freshFetch)
    expect(fresh).toBe(50000)
  })

  it('is not un-stopped by clearing the cache', async () => {
    // The engine's `shutdown` is `stopRateQueue()` and then
    // `clearRateCache()` on the very next line, so while `clearRateCache`
    // lifted the latch the stop did nothing at all: a `get-transactions`
    // that outlived the bounded drain was still inside `fillTxsFiat`,
    // still queueing dates, and those dates armed a debounce that fired
    // rates requests during `context.close()`. Queue state does not follow
    // from cache state; `startRateQueue` is the only door back.
    stopRateQueue()
    clearRateCache()
    posts = 0

    expect(isRateUnavailable(await rateFor('2024-06-01T00:00:00.000Z'))).toBe(
      true
    )
    expect(posts).toBe(0)

    startRateQueue()
    expect(await rateFor('2024-06-02T00:00:00.000Z')).toBe(30000)
    expect(posts).toBe(1)
  })

  it('does not leave a pass in flight running a second chain', async () => {
    stopRateQueue()
    clearRateCache()
    startRateQueue()
    posts = 0

    // A server slow enough that the first pass is still inside its fetch
    // when the queue is stopped underneath it. `stopRateQueue` clears
    // `inQuery` but cannot cancel that pass, so without an epoch the pass
    // carried on when it woke — recursing into `doQuery` with its own
    // `doFetch` and its own chain deadline, alongside whatever chain the
    // stop had made way for.
    let requested = 0
    const slowFetch: any = async (uri: string, opts: any) => {
      ++requested
      await new Promise(resolve => setTimeout(resolve, 400))
      return await fakeFetch(uri, opts)
    }

    const first = rateFor('2024-03-01T00:00:00.000Z', slowFetch)
    // Past `FETCH_FREQUENCY`, so the pass has fired and is *inside* the
    // fetch, which is the state this case is about. Stopping before the
    // debounce fires cancels the timer instead and no pass ever exists —
    // which is what the 50ms wait this replaces was really doing, so the
    // arm the case is named for never ran.
    await new Promise(resolve => setTimeout(resolve, 1200))
    expect(requested).toBe(1)
    stopRateQueue()

    // Whatever that pass answers for its own key, the abandoned pass adds no
    // request of its own.
    await first
    const postsAfterStop = posts

    // A stopped queue stays stopped: an arrival after the stop is settled at
    // once rather than arming a fresh chain. `stopRateQueue` used to clear
    // `inQuery` and record nothing, so the next date started a new chain —
    // and the engine calls it from `shutdown` precisely so a debounce cannot
    // fire against a closing context.
    expect(isRateUnavailable(await rateFor('2024-03-09T00:00:00.000Z'))).toBe(
      true
    )
    expect(posts).toBe(postsAfterStop)

    // And `startRateQueue` brings it back. It is its own door: when
    // `clearRateCache` lifted the latch, the engine's own `shutdown` —
    // `stopRateQueue()` and then `clearRateCache()` on the next line —
    // un-stopped the queue it had just stopped.
    startRateQueue()
    const second = await rateFor('2024-03-02T00:00:00.000Z')
    expect(second).toBe(30000)

    // Past the rest of the slow fetch and a full debounce, so the
    // abandoned pass has woken and reached the epoch check. The case used
    // to return before this point.
    const postsAfterSecond = posts
    await new Promise(resolve => setTimeout(resolve, 1500))
    expect(posts).toBe(postsAfterSecond)
    expect(postsAfterStop).toBeLessThanOrEqual(postsAfterSecond)

    // And the module still works after all of that.
    expect(await rateFor('2024-03-03T00:00:00.000Z')).toBe(30000)
  })
})

/**
 * A rejection raised outside `doQuery`'s per-group `try`.
 *
 * The `.catch` on `doQuery` in `addToQueue` is the fix for exactly that:
 * `inQuery` is set before the timer is armed, and the only place that
 * cleared it was `doQuery`'s own terminal branch — so a throw from building
 * the groups or stringifying the params left it latched for the life of the
 * process. Every later arrival then took the `!inQuery` false path, armed no
 * timer, and never settled at all, because `getHistoricalRate` never calls
 * its own `reject`. In the engine that is a `get-transactions` which hangs
 * to the client's deadline, for ever, on a daemon documented as long-lived.
 *
 * The suite's existing failure case covers the per-group `try` inside
 * `doQuery`, which is a different arm and does not touch the latch.
 */
describe('a pass that rejects outside its own try', () => {
  it('unlatches the queue when the body cannot be stringified', async () => {
    // The arm the `.catch` on `doQuery` actually exists for, and the one the
    // synchronous-transport case below does *not* reach: `doFetch` is called
    // inside `doQuery`'s per-group `try`, while `JSON.stringify(group.params)`
    // runs just before it. `inQuery` is set before the timer is armed and the
    // only place that cleared it was `doQuery`'s own terminal branch, so a
    // throw from here left it latched for the life of the process — every
    // later arrival took the `!inQuery` false path, armed no timer and never
    // settled at all, because `getHistoricalRate` never calls its own
    // `reject`. In the engine that is a `get-transactions` that hangs to the
    // client's deadline, for ever, on a daemon documented as long-lived.
    //
    // A `BigInt` tokenId is the cheapest way in: `JSON.stringify` refuses it
    // and nothing before that point looks at the type.
    stopRateQueue()
    clearRateCache()
    startRateQueue()
    posts = 0
    const chainReported: string[] = []
    configureExchangeRates({
      onError: (error: unknown) => {
        chainReported.push(String((error as Error)?.message))
      }
    })
    try {
      const first = await getHistoricalCryptoRateOrUnavailable(
        'bitcoin',
        1n as unknown as null,
        'iso:USD',
        '2024-05-01T00:00:00.000Z',
        100,
        fakeFetch
      )
      // Settled rather than hanging, and reported on the chain hook because
      // the whole chain ended.
      expect(isRateUnavailable(first)).toBe(true)
      expect(chainReported).toHaveLength(1)
      expect(chainReported[0]).toMatch(/BigInt/)
      // Nothing was asked of the server: the body never existed.
      expect(posts).toBe(0)

      // The assertion the latch is about: the *next* caller is still served.
      expect(await rateFor('2024-05-02T00:00:00.000Z')).toBe(30000)
      expect(posts).toBe(1)
    } finally {
      configureExchangeRates({})
    }
  })

  it('unlatches the queue, so the next caller is still served', async () => {
    stopRateQueue()
    clearRateCache()
    startRateQueue()
    posts = 0
    const passReported: string[] = []
    const chainReported: string[] = []
    configureExchangeRates({
      onError: (error: unknown) => {
        chainReported.push(String((error as Error)?.message))
      },
      onPassError: (error: unknown) => {
        passReported.push(String((error as Error)?.message))
      }
    })
    try {
      // A transport that throws *synchronously* rather than rejecting.
      const throwing: any = () => {
        throw new Error('sync boom')
      }
      const first = await rateFor('2024-04-01T00:00:00.000Z', throwing)
      expect(isRateUnavailable(first)).toBe(true)
      // Reported rather than swallowed, and reported once — on the *pass*
      // hook, because the transport is called inside `doQuery`'s per-group
      // `try`. The two hooks are separate because the GUI shows them
      // differently: one pass of a retried queue is a warning, and routing
      // it to `showError` meant scrolling a transaction list during a rates
      // outage threw an error drop-down and a Sentry event per failed pass.
      expect(passReported).toStrictEqual(['sync boom'])
      expect(chainReported).toStrictEqual([])

      // The assertion the latch is about: a later caller settles at all.
      // With `inQuery` left true this never resolved.
      const second = await rateFor('2024-04-02T00:00:00.000Z')
      expect(second).toBe(30000)
    } finally {
      configureExchangeRates({})
    }
  })
})

/**
 * Both bounds on the unpriced map.
 *
 * Neither was tested: the case above it asserts that `UNPRICED_TTL_MS` is at
 * most fifteen minutes — the value of a constant, not the behaviour — and
 * then clears the cache, so nothing showed that an unpriced key is
 * re-queried once the TTL passes, or that the map stays bounded in a daemon
 * that never exits. The rate cache's own bound has a real test.
 */
describe('the unpriced map', () => {
  it('re-asks the server once the TTL has passed', async () => {
    stopRateQueue()
    clearRateCache()
    startRateQueue()
    posts = 0
    const date = '2024-05-01T00:00:00.000Z'

    // The server answers, and prices nothing: that is a fact about the
    // asset, so it is remembered as `0` and not re-asked.
    expect(await rateFor(date, unpricedFetch)).toBe(0)
    expect(posts).toBe(1)
    expect(await rateFor(date, unpricedFetch)).toBe(0)
    expect(posts).toBe(1)
    expect(rateUnpricedCount()).toBe(1)

    // Past the TTL, by moving the clock rather than waiting five minutes.
    const realNow = Date.now
    try {
      Date.now = () => realNow() + UNPRICED_TTL_MS + 1
      // Asked again, and this time the server has a price.
      expect(await rateFor(date, fakeFetch)).toBe(30000)
      expect(posts).toBe(2)
    } finally {
      Date.now = realNow
    }

    // And the expired entry is dropped rather than left to the size bound.
    expect(rateUnpricedCount()).toBe(0)
  })

  it('stays bounded, like the rate cache', async () => {
    stopRateQueue()
    clearRateCache()
    startRateQueue()
    expect(rateUnpricedCount()).toBe(0)

    // One entry per unpriceable date is what a daemon that never exits
    // accumulates, so this map needs the same bound the rate cache has and
    // had no test for it. Queued before anything is awaited, like the cache
    // case above: the whole set costs one debounce and then one immediate
    // pass per batch.
    const begin = Date.UTC(2001, 0, 1)
    const day = 86_400_000
    const pending: Array<Promise<number>> = []
    for (let i = 0; i < 20_100; i++) {
      pending.push(
        rateFor(new Date(begin + i * day).toISOString(), unpricedFetch)
      )
    }
    const rates = await Promise.all(pending)
    // Every one is the server's own answer about the asset, which is `0`.
    expect(rates.every(rate => rate === 0)).toBe(true)

    // The exact size the policy produces, not merely "bounded": one
    // eviction of a quarter fires at the 20,001st key, so 20,100 inserts
    // leave 15,100. `<= 20_000` passed for an eviction that dropped all but
    // one of them.
    expect(rateUnpricedCount()).toBe(20_100 - (20_000 >> 2))
  }, 180_000)
})

/**
 * The per-group "chain budget spent" pre-check, which nothing entered.
 *
 * `doQuery` states the rule twice: once before each group's request, so a
 * group that finds the chain spent settles rather than opening a request
 * nobody waits for, and once after the loop. Only the post-loop twin had a
 * test, so one of two spellings of one rule was unasserted — and the thing
 * both have to agree about is settling at `RATE_UNAVAILABLE` rather than
 * `0`: `0` is the answer for an asset the server cannot price, and these
 * keys were never asked about.
 */
describe('a chain whose budget is spent before the request', () => {
  it('settles the group as unavailable rather than asking', async () => {
    stopRateQueue()
    clearRateCache()
    startRateQueue()
    posts = 0

    // A budget already spent when the pass starts, so the pre-check is the
    // arm that runs. Zero, not one millisecond: `stopRateQueue` resets the
    // debounce, so the pass is armed with no delay at all, and whether 1 ms
    // had elapsed by the time the timer fired depended on scheduling — on a
    // quick tick the request went out, and under load the case failed in
    // the pre-commit hook. `chainTimeoutMs` is the parameter `--timeout`
    // threads through for exactly this reason.
    const rate = await getHistoricalCryptoRateOrUnavailable(
      'bitcoin',
      null,
      'iso:USD',
      '2024-06-01T00:00:00.000Z',
      100,
      fakeFetch,
      0
    )

    expect(isRateUnavailable(rate)).toBe(true)
    // Nothing was asked, which is the point of checking before the request.
    expect(posts).toBe(0)
    // And nothing was cached or remembered as unpriceable: the server said
    // nothing about this date.
    expect(rateCacheSize()).toBe(0)
    expect(rateUnpricedCount()).toBe(0)
  })
})
