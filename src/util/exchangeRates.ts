/**
 * Core historical / batched rates against rates3/4 `v3/rates`.
 *
 * Uses Node-safe `network.fetchRates` and `fiatConstants.removeIsoPrefix`.
 * The GUI wires Airship `showError` via `exchangeRatesGui.ts`.
 */
import {
  asArray,
  asDate,
  asEither,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import type { EdgeFetchFunction, EdgeTokenId } from 'edge-core-js'

import { errorMessage } from './errorMessage'
import { removeIsoPrefix } from './fiatConstants'
import { fetchRates } from './network'
import { unrefTimer } from './raceTimeout'
import { reportWarning } from './reportWarning'
import { withDeadline } from './withDeadline'

const RATES_SERVER_MAX_QUERY_SIZE = 100
const FETCH_FREQUENCY = 1000
const SHOW_LOGS = false

const clog = SHOW_LOGS ? console.log : (...args: any) => undefined

/**
 * Where a rates failure is reported.
 *
 * The default is the shared warning sink, which the engine points at
 * `engine-<profile>.log` at boot and the GUI leaves on `console`. It used to
 * be `console.warn` directly, and in the daemon that is the startup log a
 * clean stop deletes — so a rates server that 500s, wedges mid-body or is
 * unreachable made `fillTxsFiat` answer `0` for every date, and nothing an
 * operator could read said why an export carried no fiat value.
 */
let onQueryError: (error: unknown) => void = error => {
  reportWarning(`rate query failed: ${errorMessage(error)}`)
}

/** GUI calls this from `exchangeRatesGui.ts` to show Airship errors. */
export function configureExchangeRates(opts: {
  onError?: (error: unknown) => void
}): void {
  if (opts.onError != null) onQueryError = opts.onError
}

// From rates server:
export const asCryptoAsset = asObject({
  pluginId: asString,
  tokenId: asOptional(asEither(asString, asNull))
})
const asCryptoRate = asObject({
  isoDate: asOptional(asDate),
  asset: asCryptoAsset,
  rate: asOptional(asNumber) // Return undefined if unable to get rate
})
const asFiatRate = asObject({
  isoDate: asOptional(asDate),
  fiatCode: asString,
  rate: asOptional(asNumber) // Return undefined if unable to get rate
})
export const asRatesParams = asObject({
  targetFiat: asString,
  crypto: asArray(asCryptoRate),
  fiat: asArray(asFiatRate)
})
export type RatesParams = ReturnType<typeof asRatesParams>

/**
 * The asset a crypto rate names, as one index key.
 *
 * Settling a queued entry against a response used to be
 * `data.crypto.some(sameCrypto)` inside a walk of the entire queue, so a
 * caller that queues a whole transaction history at once paid
 * `O(queued x requested)` per pass. The response is indexed by these keys
 * instead, which makes each settle a lookup.
 */
const cryptoIndexKey = (entry: {
  isoDate?: Date
  asset: { pluginId: string; tokenId?: EdgeTokenId }
}): string =>
  `${entry.asset.pluginId}|${entry.asset.tokenId ?? ''}|${
    entry.isoDate?.getTime() ?? ''
  }`

const fiatIndexKey = (entry: { isoDate?: Date; fiatCode: string }): string =>
  `${entry.fiatCode}|${entry.isoDate?.getTime() ?? ''}`

/**
 * How many rates the module-level cache keeps.
 *
 * In the GUI this was an app-session cache; behind a daemon it is a process
 * cache, and `fillTxsFiat` adds one entry per transaction date of every
 * wallet of every account the engine ever serves. An engine started with
 * `--idle-timeout=0` never exits, so the map needs a bound as well as a
 * clear function.
 */
const RATE_CACHE_MAX = 20_000

// A Map, for insertion-ordered eviction and a real `size`.
const rateMap = new Map<string, number>()

/**
 * How long a key the server answered but could not price stays unpriceable.
 *
 * Not caching `0` is right — it would answer `0` for the life of the process,
 * long after the rates server recovered — but nothing absorbed the repeat
 * either, so an asset the server has no feed for re-paid the whole fill on
 * every listing. Measured against a stub answering 200 with `rate` absent: a
 * 1,200-transaction wallet cost 13 upstream requests and about a second on
 * listing one, two and three alike, with the cache staying empty.
 *
 * Reachable on a hand-added custom token, a long-tail token with no feed, and
 * dates predating an asset's market — none of them rare on an old wallet.
 * Minutes is far longer than a listing loop and far shorter than a server
 * outage, so a repeated listing is free and a recovered server is still
 * picked up.
 */
export const UNPRICED_TTL_MS = 5 * 60_000

/**
 * The ceiling on one rates-server pass.
 *
 * `fetchRates(..., 5000, ...)` reads like one and is not: that number is
 * `asyncWaterfall`'s *per-server stagger*, and `utils.ts` arms that timer
 * only `if (pending > 1)`, so the last remaining server races against
 * nothing. Measured on the real function: `asyncWaterfall([never, never],
 * 300)` and `asyncWaterfall([fails, never], 300)` were both still pending
 * after two seconds.
 *
 * With no ceiling, one rates server that accepts a connection and never
 * answers wedged every rate caller in the process permanently: `doQuery`
 * stayed awaiting with `inQuery` latched, `addToQueue` deliberately arms no
 * second timer while that is true, and `getHistoricalRate` never calls its
 * own `reject` — so each later caller's promise simply never settled. For
 * the daemon that is `get-transactions` hanging to the client's deadline for
 * the life of the engine.
 *
 * The recovery this hands to already existed for the *rejection* path; the
 * hang had nothing to reject, which is what this supplies.
 *
 * `asyncWaterfall`'s own contract is deliberately left alone: two comments
 * in the repository — `keysServer.ts` and `keysStore.ts` — state that its
 * parameter is a stagger rather than a ceiling, and the cold-start path
 * bounds itself the same way this does.
 */
export const RATE_QUERY_TIMEOUT_MS = 30_000

/**
 * The budget for *one caller's* fill, across every pass it takes.
 *
 * `RATE_QUERY_TIMEOUT_MS` bounds one upstream request, and `doQuery`
 * recurses once per batch: a pass carries at most 99 keys, so a wait is
 * (number of batches) × 30 s. `fillTxsFiat`'s own docblock cites 1,200
 * unpriced transactions as the real case — 13 passes, about 390 s — against
 * `apiClient`'s `DEFAULT_TIMEOUT_MS` of 120 s, so the client reported
 * `Request timed out` and the daemon kept working for another four and a
 * half minutes with `inQuery` latched, every other rate caller in the
 * process queued behind it.
 *
 * Under that 120 s, so the queue gives up before the client does, and well
 * above a healthy chain: 13 passes against a server answering in a few
 * hundred milliseconds is a couple of seconds. Keys still unsettled when it
 * is spent are settled at `0`, which is the same answer a failed request
 * already gives them.
 */
export const RATE_CHAIN_TIMEOUT_MS = 90_000

/**
 * The answer for a key the queue gave up on, as opposed to could not price.
 *
 * `0` already meant "the server answered without a price for this date",
 * which is a fact about the asset and is cached as one. The chain budget
 * expiring and a failed request were settled at `0` as well, so the one
 * caller that must not write a wrong number — an accounting export's fiat
 * column — could not tell them apart: `fillTxsFiat`'s `.catch` never saw it,
 * nothing was logged, and the CSV, QBO and Bitwave files carried a zero fiat
 * amount for an arbitrary tail of the oldest transactions while `total`
 * reported the real count.
 *
 * `NaN`, so that no arithmetic on it can produce a plausible-looking figure.
 * That makes it unsafe to publish: `mul`, `div` and `add` take strings, and
 * `String(NaN)` is `'NaN'`, which biggystring rejects — so a sentinel
 * reaching a GUI consumer written against the old `0` throws out of a render
 * or a ramp quote rather than degrading. It therefore never leaves this module: only
 * `getHistoricalCryptoRateOrUnavailable` and
 * `getHistoricalFiatRateOrUnavailable` return it, and
 * `getHistoricalCryptoRate` / `getHistoricalFiatRate` fold it to `0` for
 * everyone else.
 */
export const RATE_UNAVAILABLE = Number.NaN

/** Whether a rate is the "gave up" answer rather than a price. */
export function isRateUnavailable(rate: number): boolean {
  return !Number.isFinite(rate)
}

/** Keys the server answered without a price, and when it said so. */
const unpricedMap = new Map<string, number>()
const resolverMap = new Map<
  string,
  {
    resolvers: Function[]
    rateQueueEntry: RatesParams
  }
>()
let inQuery = false
/**
 * When the last query finished, for the leading-edge debounce.
 *
 * A trailing-edge debounce spends a full `FETCH_FREQUENCY` before the *first*
 * request, which is the worst case for a daemon: every engine request starts
 * from an idle queue, so `get-transactions` paid it twice in series — once
 * for the spam threshold and once for the fiat fill — a fixed ~2s floor
 * independent of page size, and ~1s even when every rate was already cached.
 */
let lastQueryEndedAt = 0
/**
 * Bumped by `stopRateQueue`, so a pass in flight can tell it is unwanted.
 *
 * Stopping the queue clears `inQuery` but cannot cancel a `doQuery` already
 * awaiting a response. Without this, a key queued immediately after a stop
 * armed a second chain that ran concurrently with the first.
 */
let queueEpoch = 0
let queryTimer: ReturnType<typeof setTimeout> | undefined

/** One upstream request: its parameters, and the queue keys it speaks for. */
interface RateQueryGroup {
  params: RatesParams
  keys: string[]
}

let numDoQuery = 0
const doQuery = async (
  doFetch?: EdgeFetchFunction,
  // One deadline for the whole chain, set by the first pass and carried
  // through every recursion. Without it each pass armed a fresh 30 s.
  chainEndsAt: number = Date.now() + RATE_CHAIN_TIMEOUT_MS
): Promise<void> => {
  const n = numDoQuery++
  const epoch = queueEpoch
  clog(`${n} doQuery enter`)

  const groups = new Map<string, RateQueryGroup>()

  // Fill the query up to RATES_SERVER_MAX_QUERY_SIZE entries
  for (const [key, value] of resolverMap.entries()) {
    const group = groups.get(value.rateQueueEntry.targetFiat)
    if (group == null) {
      groups.set(value.rateQueueEntry.targetFiat, {
        params: value.rateQueueEntry,
        keys: [key]
      })
      continue
    }

    // The server rejects a request whose `crypto` or `fiat` array reaches
    // RATES_SERVER_MAX_QUERY_SIZE ("must be less than 100"), so this stops
    // *before* adding an entry that would cross it. Testing the pre-insert
    // length for equality instead let a batch reach 101 and let a batch that
    // stepped over 100 never stop at all; whatever is left over is picked up
    // by the retry at the end of this function.
    if (
      group.params.crypto.length + value.rateQueueEntry.crypto.length >=
        RATES_SERVER_MAX_QUERY_SIZE ||
      group.params.fiat.length + value.rateQueueEntry.fiat.length >=
        RATES_SERVER_MAX_QUERY_SIZE
    ) {
      break
    }

    group.params = {
      targetFiat: group.params.targetFiat,
      crypto: [...group.params.crypto, ...value.rateQueueEntry.crypto],
      fiat: [...group.params.fiat, ...value.rateQueueEntry.fiat]
    }
    group.keys.push(key)
  }

  for (const group of groups.values()) {
    // Whichever is nearer: this request's own ceiling, or what is left of
    // the caller's. A group that finds the chain spent settles at `0` rather
    // than opening another request nobody is waiting for.
    const budget = Math.min(RATE_QUERY_TIMEOUT_MS, chainEndsAt - Date.now())
    if (budget <= 0) {
      clog(`${n} chain budget spent; settling ${group.keys.length} keys`)
      for (const key of group.keys) {
        const pending = resolverMap.get(key)
        if (pending == null) continue
        resolverMap.delete(key)
        // `RATE_UNAVAILABLE`, not `0`: nobody asked the server about these
        // keys, so this says nothing about whether they can be priced.
        pending.resolvers.forEach(resolve => resolve(RATE_UNAVAILABLE))
      }
      continue
    }
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group.params)
    }
    try {
      // The body read is *inside* the budget, not just the headers. Under
      // Node's `fetch` a response resolves as soon as headers arrive, so a
      // server that answered 200 and then stalled mid-body left `doQuery`
      // awaiting `response.json()` with `inQuery` latched — and `addToQueue`
      // arms no second timer while that is true, so every key queued
      // afterwards went into a `resolverMap` nothing would drain and no
      // caller's promise ever settled. Measured on Node 24: `fetch()`
      // resolved in 51ms against such a server and `response.json()` was
      // still pending four seconds later, with undici's 300s `bodyTimeout`
      // the only backstop — two and a half times the client's own deadline.
      const cleanedRates = await withDeadline(
        (async () => {
          // `fetchRates`'s own default fetch carries the abort, because
          // `doFetch` is a per-*pass* value: `addToQueue` captures it only
          // when it arms the timer, `doQuery` recurses with that binding,
          // and the two consumers every `get-transactions` goes through —
          // `fillTxsFiat` and `resolveListSpamThreshold` — pass none at all.
          const response = await fetchRates('v3/rates', options, 5000, doFetch)
          if (!response.ok) {
            const text = await response.text()
            throw new Error(text)
          }
          return asRatesParams(await response.json())
        })(),
        budget,
        'the rates server did not answer'
      )

      // One index per response, so settling a key costs a lookup rather than
      // a scan of both request arrays.
      const cryptoRates = new Map<string, number | undefined>()
      for (const rate of cleanedRates.crypto) {
        cryptoRates.set(cryptoIndexKey(rate), rate.rate)
      }
      const fiatRates = new Map<string, number | undefined>()
      for (const rate of cleanedRates.fiat) {
        fiatRates.set(fiatIndexKey(rate), rate.rate)
      }

      // Only the keys this request carried. A key queued while the request
      // was in flight was never asked about, so it is none of this response's
      // business and gets a pass of its own below. Settling those here
      // answered `0` for a rate the server could have priced.
      for (const key of group.keys) {
        const pending = resolverMap.get(key)
        if (pending == null) continue
        const { rateQueueEntry, resolvers } = pending

        // The server answered, so this key settles either way: at `0` when it
        // came back unpriced, because a key that survives its own response
        // would make the retry below spin forever.
        let rate = 0
        if (rateQueueEntry.crypto.length === 1) {
          const cryptoRate = cryptoRates.get(
            cryptoIndexKey(rateQueueEntry.crypto[0])
          )
          const fiatRate = fiatRates.get(fiatIndexKey(rateQueueEntry.fiat[0]))
          if (cryptoRate != null && fiatRate != null && fiatRate !== 0) {
            rate = cryptoRate / fiatRate
          }
        } else if (rateQueueEntry.fiat.length === 2) {
          const fromRate = fiatRates.get(fiatIndexKey(rateQueueEntry.fiat[0]))
          const toRate = fiatRates.get(fiatIndexKey(rateQueueEntry.fiat[1]))
          if (fromRate != null && toRate != null && toRate !== 0) {
            rate = fromRate / toRate
          }
        }

        // `0` means "the server could not price this", not a rate, so it does
        // not go in the rate cache — that would answer `0` for the life of
        // the process. It goes in a short-lived negative cache instead, so a
        // second listing of the same wallet does not re-ask for every date.
        if (rate !== 0) cacheRate(key, rate)
        else noteUnpriced(key)
        clog(`${n} deleting ${key}`)
        resolverMap.delete(key)
        resolvers.forEach(r => r(rate))
      }
    } catch (e: unknown) {
      // Through the same hook, and with no `instanceof Error` gate: that
      // discarded a non-`Error` throw entirely, so the one failure mode with
      // no report at all was the one nobody had anticipated.
      onQueryError(e)
      // Give up on this request's own keys only. The queue may also hold keys
      // another group owns and keys that arrived mid-flight, and neither was
      // part of this failure.
      for (const key of group.keys) {
        const pending = resolverMap.get(key)
        if (pending == null) continue
        clog(`${n} throw deleting ${key}`)
        resolverMap.delete(key)
        // A failed request is not a priceless asset either.
        pending.resolvers.forEach(resolve => resolve(RATE_UNAVAILABLE))
      }
    }
  }

  // Every key this pass asked about has settled, so whatever is left was
  // never sent: the RATES_SERVER_MAX_QUERY_SIZE remainder, or an arrival from
  // during the round trip, which `addToQueue` deliberately does not arm a
  // second timer for. Each pass therefore removes at least the keys it asked
  // about, so this terminates.
  if (epoch !== queueEpoch) {
    // The queue was stopped while this pass was in flight. Whatever is left
    // was settled by `stopRateQueue`, and recursing would run a second chain
    // alongside a queue that no longer wants one.
    clog(`${n} doQuery abandoned: queue stopped`)
  } else if (resolverMap.size > 0 && Date.now() < chainEndsAt) {
    clog(`${n} Calling doQuery again`)
    await doQuery(doFetch, chainEndsAt)
  } else if (resolverMap.size > 0) {
    // The chain outlived its caller. Settling at `0` rather than recursing
    // keeps the daemon from working on a response nobody is reading, and
    // unlatches `inQuery` for the next caller.
    clog(`${n} chain budget spent; settling ${resolverMap.size} keys`)
    settleQueuedAsUnavailable()
    inQuery = false
    lastQueryEndedAt = Date.now()
  } else {
    clog(`${n} doQuery complete`)
    inQuery = false
    lastQueryEndedAt = Date.now()
  }
}

const addToQueue = (
  entry: RatesParams,
  rateKey: string,
  resolve: Function,
  maxQuerySize: number,
  doFetch?: EdgeFetchFunction,
  /**
   * The budget for the whole chain, from the caller that arms it.
   *
   * `RATE_CHAIN_TIMEOUT_MS` is the default and was the only value, so the
   * one control the engine offers for "slow is better than wrong" —
   * `--timeout`, which moves `apiClient`'s own deadline — had no effect on
   * the work it is waiting for. A 10,000-transaction export is 102 passes,
   * and a server answering in ~700 ms spends 90 s before they finish.
   */
  chainTimeoutMs?: number
): void => {
  const rateKeyResolver = resolverMap.get(rateKey)
  if (rateKeyResolver == null) {
    // Create a new entry in the map for this pair/date
    clog(`adding ${rateKey}`)
    resolverMap.set(rateKey, {
      resolvers: [resolve],
      rateQueueEntry: entry
    })
  } else {
    // Add a resolver to existing pair/date entry
    rateKeyResolver.resolvers.push(resolve)
    return
  }
  if (!inQuery) {
    inQuery = true
    // Leading edge when the queue has been idle at least `FETCH_FREQUENCY`,
    // and otherwise only far enough out to keep that as the minimum spacing
    // between requests. Deferred by a tick rather than run synchronously, so
    // a burst of per-row lookups still collapses into one batch, and anything
    // arriving during the round trip is coalesced by `doQuery`'s own
    // recursion — which is what keeps a burst to a bounded number of requests
    // rather than one per caller.
    const idleFor = Date.now() - lastQueryEndedAt
    const delay = idleFor >= FETCH_FREQUENCY ? 0 : FETCH_FREQUENCY - idleFor
    const chainEndsAt =
      Date.now() + delay + (chainTimeoutMs ?? RATE_CHAIN_TIMEOUT_MS)
    queryTimer = setTimeout(() => {
      queryTimer = undefined
      doQuery(doFetch, chainEndsAt).catch((error: unknown) => {
        // Unlatch before reporting. `inQuery` is set above and the only
        // place that cleared it was `doQuery`'s own terminal branch, so a
        // rejection from anywhere outside its per-group `try` — building the
        // groups, or stringifying the params — left it latched for the life
        // of the process: every later arrival took the `!inQuery` false
        // path, armed no timer, and never settled, because
        // `getHistoricalRate` never calls its own `reject`. In the engine
        // that is a `get-transactions` that hangs to the client's deadline,
        // for ever, on a daemon documented as long-lived. One bad pass now
        // costs one pass.
        inQuery = false
        lastQueryEndedAt = Date.now()
        settleQueuedAsUnavailable()
        onQueryError(error)
      })
    }, delay)
    unrefTimer(queryTimer)
  }
}

/** Remember that the server answered this key without a price. */
function noteUnpriced(key: string): void {
  // Bounded like the rate cache, and by the same reasoning: a daemon that
  // never exits would otherwise accumulate one entry per unpriceable date.
  if (unpricedMap.size >= RATE_CACHE_MAX) {
    for (const victim of [...unpricedMap.keys()].slice(
      0,
      RATE_CACHE_MAX >> 2
    )) {
      unpricedMap.delete(victim)
    }
  }
  unpricedMap.set(key, Date.now())
}

/** Whether the server said recently that it cannot price this key. */
function isRecentlyUnpriced(key: string): boolean {
  const at = unpricedMap.get(key)
  if (at == null) return false
  if (Date.now() - at < UNPRICED_TTL_MS) return true
  // Expired, so forget it rather than leaving it to the size bound.
  unpricedMap.delete(key)
  return false
}

/**
 * Remember a rate, evicting the oldest entries once the map is full.
 *
 * A Map iterates in insertion order, so the oldest entries go first: a long
 * listing pages through dates in order, and the earliest are the ones least
 * likely to be asked for again.
 */
function cacheRate(key: string, rate: number): void {
  if (!rateMap.has(key) && rateMap.size >= RATE_CACHE_MAX) {
    // A quarter at a time rather than one per insert, so a long listing does
    // not pay an eviction on every transaction.
    const victims = [...rateMap.keys()].slice(0, RATE_CACHE_MAX >> 2)
    for (const victim of victims) rateMap.delete(victim)
  }
  rateMap.set(key, rate)
}

/**
 * Drop every cached rate.
 *
 * A module-level cache in a long-lived process needs an owner: the engine
 * calls this when the last session goes away and again on shutdown, so a
 * daemon does not accumulate one entry per transaction date for the life of
 * the machine.
 */
export function clearRateCache(): void {
  rateMap.clear()
  unpricedMap.clear()
}

/**
 * Stop the pending query and settle whatever is still queued.
 *
 * `clearRateCache` empties the cache, which says nothing about work in
 * flight: a debounce armed just before shutdown would otherwise fire against
 * a closing context, and anything awaiting a rate would never settle. The
 * engine calls this from `shutdown`, and a test calls it so no timer outlives
 * the suite.
 */
export function stopRateQueue(): void {
  if (queryTimer != null) {
    clearTimeout(queryTimer)
    queryTimer = undefined
  }
  inQuery = false
  // So a pass already in flight does not recurse into another one after the
  // queue has been stopped. It cannot be cancelled, but it can be told its
  // work is no longer wanted: `doQuery` compares the epoch it started with.
  queueEpoch++
  // So the next query after a stop is not throttled against a pass that
  // never ran. A test that stops the queue between cases wants the same
  // starting point each time.
  lastQueryEndedAt = 0
  settleQueuedAsUnavailable()
}

/**
 * Settle every queued caller with `RATE_UNAVAILABLE` and empty the queue.
 *
 * Reached when the chain outlived its caller, when a pass threw outside its
 * own `try`, and when the queue was stopped — three cases in which nothing
 * was learned about these keys. It settled them at `0` before, which is the
 * answer for an asset the server cannot price, so an export wrote zeros for
 * the tail it never asked about.
 */
function settleQueuedAsUnavailable(): void {
  for (const [key, { resolvers }] of [...resolverMap.entries()]) {
    resolverMap.delete(key)
    resolvers.forEach(resolve => resolve(RATE_UNAVAILABLE))
  }
}

/** How many rates are cached. `engine-status` reports it as `rateCachedCount`. */
export function rateCacheSize(): number {
  return rateMap.size
}

/**
 * How many keys the server answered without a price.
 *
 * `engine-status` reports it as `rateUnpricedCount`. Worth publishing beside
 * the cached count: an asset with no feed used to cost a full re-query on
 * every listing with nothing to show for it, and the number is what makes
 * that visible rather than silent.
 */
export function rateUnpricedCount(): number {
  return unpricedMap.size
}

const createRateKey = (
  asset: { pluginId: string; tokenId?: EdgeTokenId } | string,
  targetFiat: string,
  date?: string
): string => {
  let dateString = ''
  if (date != null) {
    dateString = `_${date}`
  }

  if (typeof asset === 'object') {
    let tokenIdString = ''
    if (asset.tokenId != null) {
      tokenIdString = `_${asset.tokenId}`
    }

    return `${asset.pluginId}${tokenIdString}_${targetFiat}${dateString}`
  }

  return `${asset}_${targetFiat}${dateString}`
}

/**
 * A historical crypto rate, or `RATE_UNAVAILABLE` when the queue gave up.
 *
 * For the two callers that must tell "the server says it cannot price this"
 * from "we never got an answer": an accounting export, which refuses rather
 * than write a wrong fiat column, and `rates-query`, which publishes which
 * of the two happened. Every other caller wants `getHistoricalCryptoRate`.
 */
export const getHistoricalCryptoRateOrUnavailable = async (
  pluginId: string,
  tokenId: EdgeTokenId,
  targetFiat: string,
  date: string,
  maxQuerySize: number = RATES_SERVER_MAX_QUERY_SIZE,
  doFetch?: EdgeFetchFunction,
  chainTimeoutMs?: number
): Promise<number> => {
  const rateKey = createRateKey({ pluginId, tokenId }, targetFiat, date)

  return await getHistoricalRate(
    {
      targetFiat: 'USD',
      crypto: [
        {
          isoDate: new Date(date),
          asset: { pluginId, tokenId },
          rate: undefined
        }
      ],
      fiat: [
        {
          isoDate: new Date(date),
          fiatCode: removeIsoPrefix(targetFiat),
          rate: undefined
        }
      ]
    },
    rateKey,
    maxQuerySize,
    doFetch,
    chainTimeoutMs
  )
}
/**
 * A historical fiat rate, or `RATE_UNAVAILABLE` when the queue gave up.
 *
 * The fiat half of `getHistoricalCryptoRateOrUnavailable`, on the same terms.
 */
export const getHistoricalFiatRateOrUnavailable = async (
  fiatCode: string,
  targetFiat: string,
  date: string,
  maxQuerySize: number = RATES_SERVER_MAX_QUERY_SIZE,
  doFetch?: EdgeFetchFunction
): Promise<number> => {
  return await getHistoricalRate(
    {
      targetFiat: 'USD',
      crypto: [],
      fiat: [
        {
          isoDate: new Date(date),
          fiatCode: removeIsoPrefix(fiatCode),
          rate: undefined
        },
        {
          isoDate: new Date(date),
          fiatCode: removeIsoPrefix(targetFiat),
          rate: undefined
        }
      ]
    },
    createRateKey(fiatCode, targetFiat, date),
    maxQuerySize,
    doFetch
  )
}

/**
 * A historical crypto rate, with `0` for "no price".
 *
 * The long-standing contract, and the one every GUI consumer is written
 * against: a rate the server cannot supply, and now also one the queue never
 * got an answer about, both arrive as `0`. Callers that divide by it already
 * check for zero; what they cannot survive is `RATE_UNAVAILABLE`, which is
 * `NaN` and reaches biggystring as the string `'NaN'`.
 */
export const getHistoricalCryptoRate = async (
  pluginId: string,
  tokenId: EdgeTokenId,
  targetFiat: string,
  date: string,
  maxQuerySize: number = RATES_SERVER_MAX_QUERY_SIZE,
  doFetch?: EdgeFetchFunction,
  chainTimeoutMs?: number
): Promise<number> => {
  const rate = await getHistoricalCryptoRateOrUnavailable(
    pluginId,
    tokenId,
    targetFiat,
    date,
    maxQuerySize,
    doFetch,
    chainTimeoutMs
  )
  return isRateUnavailable(rate) ? 0 : rate
}

/** A historical fiat rate, with `0` for "no price". */
export const getHistoricalFiatRate = async (
  fiatCode: string,
  targetFiat: string,
  date: string,
  maxQuerySize: number = RATES_SERVER_MAX_QUERY_SIZE,
  doFetch?: EdgeFetchFunction
): Promise<number> => {
  const rate = await getHistoricalFiatRateOrUnavailable(
    fiatCode,
    targetFiat,
    date,
    maxQuerySize,
    doFetch
  )
  return isRateUnavailable(rate) ? 0 : rate
}

const getHistoricalRate = async (
  RatesParams: RatesParams,
  rateKey: string,
  maxQuerySize: number = RATES_SERVER_MAX_QUERY_SIZE,
  doFetch?: EdgeFetchFunction,
  chainTimeoutMs?: number
): Promise<number> => {
  return await new Promise(resolve => {
    const rate = rateMap.get(rateKey)
    if (rate == null) {
      if (isRecentlyUnpriced(rateKey)) {
        // Answered already: the server has said it cannot price this key
        // within the TTL, and asking again costs a round trip per date. `0`
        // rather than `RATE_UNAVAILABLE`, because this *is* an answer about
        // the asset.
        resolve(0)
        return
      }
      addToQueue(
        RatesParams,
        rateKey,
        resolve,
        maxQuerySize,
        doFetch,
        chainTimeoutMs
      )
      return
    }

    resolve(rate)
  })
}
