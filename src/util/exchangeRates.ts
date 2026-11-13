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
 * One pass of the chain failed, and the chain carries on.
 *
 * The default is the shared warning sink, which the engine points at
 * `engine-<profile>.log` at boot and the GUI leaves on `console`. In the
 * daemon, `console` reaches only the startup log a clean stop deletes, so a
 * rates server that 500s, wedges mid-body or is unreachable would leave
 * nothing an operator could read about why an export carried no fiat value.
 *
 * Separate from `onChainError` because the two are different events and the
 * GUI shows them differently. Only the chain-level failure reaches
 * `showError`, which shows an Airship drop-down *and* sends a Sentry event.
 * `TransactionListRow` calls `useHistoricalRate` once per visible row, so
 * routing every failed pass there would turn scrolling a wallet's
 * transaction list during a rates-server outage into an error drop-down and
 * a Sentry event per failed pass. The engine reports a pass as
 * `report.warn`, which is the right level for one pass of a retried
 * background queue.
 */
let onQueryError: (error: unknown) => void = error => {
  reportWarning(`rate query failed: ${errorMessage(error)}`)
}

/** The chain itself ended, so nothing more will be tried for these keys. */
let onChainError: (error: unknown) => void = error => {
  reportWarning(`rate query chain failed: ${errorMessage(error)}`)
}

/**
 * GUI calls this from `exchangeRatesGui.ts`; the engine from `engine/index`.
 *
 * `onError` is the chain-level failure — the one that ends the work and is
 * worth a drop-down. `onPassError` is one pass of a retried queue; leaving
 * it unset keeps the quiet default, which is what the GUI does.
 */
export function configureExchangeRates(opts: {
  onError?: (error: unknown) => void
  onPassError?: (error: unknown) => void
}): void {
  if (opts.onError != null) onChainError = opts.onError
  if (opts.onPassError != null) onQueryError = opts.onPassError
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
 * The response is indexed by these keys, which makes settling a queued entry
 * a lookup: scanning the response for each queued entry would cost a caller
 * that queues a whole transaction history `O(queued x requested)` per pass.
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
 * Behind a daemon this is a process cache, and `fillTxsFiat` adds one entry
 * per transaction date of every wallet of every account the engine ever
 * serves. An engine started with `--idle-timeout=0` never exits, so the map
 * needs a bound as well as a clear function.
 */
const RATE_CACHE_MAX = 20_000

// A Map, for insertion-ordered eviction and a real `size`.
const rateMap = new Map<string, number>()

/**
 * How long a key the server answered but could not price stays unpriceable.
 *
 * `0` is not cached: it would answer `0` for the life of the process, long
 * after the rates server recovered. This window absorbs the repeat instead,
 * so an asset the server has no feed for does not repeat the whole fill on
 * every listing.
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
 * only while another server is left to start, so the last remaining server
 * races against nothing.
 *
 * With no ceiling, one rates server that accepts a connection and never
 * answers would wedge every rate caller in the process permanently:
 * `doQuery` would stay awaiting with `inQuery` latched, `addToQueue`
 * deliberately arms no second timer while that is true, and
 * `getHistoricalRate` never calls its own `reject`, so each later caller's
 * promise would never settle. For the daemon that is `get-transactions`
 * hanging to the client's deadline for the life of the engine.
 *
 * A hang has nothing to reject, so this supplies the rejection, and the
 * request then takes the same recovery path as one that failed.
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
 * (number of batches) × 30 s. 1,200 unpriced transactions are 13 passes,
 * about 390 s, against `apiClient`'s `DEFAULT_TIMEOUT_MS` of 120 s: without
 * this budget the client would report `Request timed out` while the daemon
 * kept working with `inQuery` latched, every other rate caller in the
 * process queued behind it.
 *
 * Under that 120 s, so the queue gives up before the client does, and well
 * above a healthy chain: 13 passes against a server answering in a few
 * hundred milliseconds is a couple of seconds. Keys still unsettled when it
 * is spent are settled as `RATE_UNAVAILABLE`, which is the same answer a
 * failed request gives them.
 */
export const RATE_CHAIN_TIMEOUT_MS = 90_000

/**
 * The most `rateChainBudgetMs` will ask for, however many keys there are.
 *
 * The arithmetic below is a worst case — every pass taking its full 30 s —
 * and a 50,000-transaction wallet would scale to four hours of it. Someone
 * is waiting at a spinner, so there is a ceiling; past it the fill reports
 * what it could not price and the caller decides.
 */
export const RATE_CHAIN_BUDGET_MAX_MS = 600_000

/**
 * A chain budget that fits the number of keys the caller is asking about.
 *
 * `RATE_CHAIN_TIMEOUT_MS` is one number for every caller, and too small for a
 * full-history export: `doQuery` recurses once per batch, and a batch stays
 * below `RATES_SERVER_MAX_QUERY_SIZE`, so 10,000 transactions is 102 passes,
 * which can spend the whole fixed 90 s before they finish. Every unsettled
 * key is then `RATE_UNAVAILABLE`, and a caller that refuses an export on
 * that count would refuse *deterministically*, with no control to raise the
 * budget.
 *
 * So the budget is derived from the work instead: the batches the keys will
 * take, times the per-request bound each of them is allowed. Never below
 * `RATE_CHAIN_TIMEOUT_MS`, so a small fill keeps that headroom, and never
 * above `RATE_CHAIN_BUDGET_MAX_MS`.
 *
 * A caller with a deadline of its own — the engine, which has the client's
 * `--timeout` — passes that instead; this is for the callers whose only
 * limit is the user's patience.
 */
export function rateChainBudgetMs(keyCount: number): number {
  const passes = Math.ceil(Math.max(keyCount, 1) / RATES_SERVER_MAX_QUERY_SIZE)
  return Math.min(
    RATE_CHAIN_BUDGET_MAX_MS,
    Math.max(RATE_CHAIN_TIMEOUT_MS, passes * RATE_QUERY_TIMEOUT_MS)
  )
}

/**
 * The answer for a key the queue gave up on, as opposed to could not price.
 *
 * `0` means "the server answered without a price for this date", which is a
 * fact about the asset and is cached as one. The chain budget expiring and a
 * failed request get this answer instead, so the one caller that must not
 * write a wrong number — an accounting export's fiat column — can tell them
 * apart, rather than write a zero fiat amount for an arbitrary tail of the
 * oldest transactions.
 *
 * `NaN`, so that no arithmetic on it can produce a plausible-looking figure.
 * That makes it unsafe to publish: `mul`, `div` and `add` take strings, and
 * `String(NaN)` is `'NaN'`, which biggystring rejects, so a sentinel
 * reaching a GUI consumer written against `0` would throw out of a render or
 * a ramp quote rather than degrade. It therefore leaves this module only
 * through `getHistoricalCryptoRateOrUnavailable` and
 * `getHistoricalFiatRateOrUnavailable`, and `getHistoricalCryptoRate` /
 * `getHistoricalFiatRate` fold it to `0` for everyone else.
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
    /**
     * When *this key's* callers stop waiting.
     *
     * Per key rather than per chain, because the engine serves requests
     * concurrently: a deadline set by whichever caller armed the chain would
     * refuse `get-transactions --export-format=csv --timeout=600` with
     * `RATES_INCOMPLETE` whenever a `rates-query` (no budget, so 90 s) or a
     * `--timeout=2` armed the chain first, and the error's advice to raise
     * `--timeout` could not help, because that caller's own budget would
     * never be consulted.
     *
     * A second caller waiting on a key already queued raises it to the more
     * generous of the two: they are sharing one request, and the longer
     * wait is the one someone is still prepared to make.
     */
    endsAt: number
  }
>()
let inQuery = false
/**
 * When the last query finished, for the leading-edge debounce.
 *
 * A trailing-edge debounce spends a full `FETCH_FREQUENCY` before the *first*
 * request, which is the worst case for a daemon: every engine request starts
 * from an idle queue, so `get-transactions` would pay it twice in series,
 * once for the spam threshold and once for the fiat fill.
 */
let lastQueryEndedAt = 0
/**
 * Bumped by `stopRateQueue`, so a pass in flight can tell it is unwanted.
 *
 * Stopping the queue clears `inQuery` but cannot cancel a `doQuery` already
 * awaiting a response, so the pass compares the epoch it started with and
 * stops rather than run alongside a chain armed after the stop.
 */
let queueEpoch = 0
/**
 * Set by `stopRateQueue`, so a stopped queue stays stopped.
 *
 * The epoch tells a pass in flight that its work is unwanted; this tells the
 * *next arrival* that there is no queue to join. Cleared only by
 * `startRateQueue`.
 *
 * Not cleared by `clearRateCache`: the engine's `shutdown` calls
 * `stopRateQueue()` and then `clearRateCache()` on the next line, so a cache
 * clear that lifted the latch would undo the stop at once. Queue state and
 * cache state are separate things, and nothing infers one from the other.
 */
let queueStopped = false
let queryTimer: ReturnType<typeof setTimeout> | undefined
/**
 * The one timer that settles a queued key at its own deadline.
 *
 * A pass waits for its request — up to `RATE_QUERY_TIMEOUT_MS` — before the
 * next one starts, and every queued key shares one group, whose request
 * budget is the *latest* deadline in it. Settling only when a pass begins
 * would make a `get-transactions --timeout=5` that arrives during a
 * `--timeout=600` export's pass wait the whole 30 s request out and time
 * out at the client instead of answering at 5 s with `unpricedCount`. Armed
 * for the nearest `endsAt`, re-armed whenever that changes, and cleared by
 * `stopRateQueue`.
 */
let expiryTimer: ReturnType<typeof setTimeout> | undefined
let expiryTimerAt = Infinity

/** One upstream request: its parameters, and the queue keys it speaks for. */
interface RateQueryGroup {
  params: RatesParams
  keys: string[]
}

let numDoQuery = 0
const doQuery = async (doFetch?: EdgeFetchFunction): Promise<void> => {
  const n = numDoQuery++
  const epoch = queueEpoch
  clog(`${n} doQuery enter`)

  // Before anything is asked: a key whose own callers have stopped waiting
  // is settled and taken out, and nobody else's key is touched.
  settleExpiredQueued()

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
    // *before* adding an entry that would cross it; whatever is left over is
    // picked up by the retry at the end of this function.
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
    // Re-checked per group, not once after the loop — "check cancel after
    // every await". Every key queued today shares the `'USD'` target, so a
    // pass holds one group and this guards the shape rather than a case;
    // the check after the request below is the one with a real caller.
    if (epoch !== queueEpoch) break
    // Whichever is nearer: this request's own ceiling, or the most patient
    // caller in the group. Keys with less time than that have already been
    // settled and removed by `settleExpiredQueued`, so the group's own
    // latest deadline is what is left to serve — a group with nothing left
    // to serve opens no request.
    const groupEndsAt = Math.max(
      ...group.keys.map(key => resolverMap.get(key)?.endsAt ?? 0)
    )
    const budget = Math.min(RATE_QUERY_TIMEOUT_MS, groupEndsAt - Date.now())
    if (budget <= 0) {
      clog(`${n} budget spent; settling ${group.keys.length} keys`)
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
      // server that answers 200 and then stalls mid-body would leave
      // `doQuery` awaiting `response.json()` with `inQuery` latched — and
      // `addToQueue` arms no second timer while that is true, so every key
      // queued afterwards would go into a `resolverMap` nothing drains, with
      // undici's 300s `bodyTimeout` the only backstop: two and a half times
      // the client's own deadline.
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
      // And after the request itself. A stopped queue has already settled
      // every key it held, and a restarted one may have queued the same key
      // names for new callers — settling those from this stale answer is the
      // cross-epoch half of stopping a pass in flight.
      if (epoch !== queueEpoch) break

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
      // business and gets a pass of its own below. Settling those here would
      // answer `0` for a rate the server could have priced.
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
      // Through the same hook, and with no `instanceof Error` gate: a gate
      // would discard a non-`Error` throw entirely, leaving the one failure
      // mode nobody anticipated with no report at all.
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
  } else if (hasLiveQueuedKey()) {
    clog(`${n} Calling doQuery again`)
    await doQuery(doFetch)
  } else if (resolverMap.size > 0) {
    // Everything left has outlived its own caller. Settling rather than
    // recursing keeps the daemon from working on a response nobody is
    // reading, and unlatches `inQuery` for the next caller.
    clog(`${n} every queued budget spent; settling ${resolverMap.size} keys`)
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
   * This caller's budget for its key, across the whole chain.
   *
   * `RATE_CHAIN_TIMEOUT_MS` is the default. A caller with a deadline of its
   * own passes it, so `--timeout`, the one control the engine offers for
   * "slow is better than wrong", moves the work it is waiting for and not
   * only `apiClient`'s own deadline.
   */
  chainTimeoutMs?: number
): void => {
  // A stopped queue stays stopped. `stopRateQueue` clears `inQuery`, bumps
  // the epoch and settles what was queued, so without this latch the very
  // next arrival would take the `!inQuery` branch, arm a fresh timer and
  // start a new chain whose epoch the guard in `doQuery` accepts. The engine
  // calls `stopRateQueue` from `shutdown` so a debounce cannot fire against
  // a closing context, and `drainRequests` is bounded and gives up, so a
  // `get-transactions` that outlives the drain is still inside
  // `fillTxsFiat`, still queueing dates, which would otherwise fire rates
  // requests during `context.close()`.
  if (queueStopped) {
    resolve(RATE_UNAVAILABLE)
    return
  }
  const budgetMs = chainTimeoutMs ?? RATE_CHAIN_TIMEOUT_MS
  const rateKeyResolver = resolverMap.get(rateKey)
  if (rateKeyResolver == null) {
    // Create a new entry in the map for this pair/date
    clog(`adding ${rateKey}`)
    resolverMap.set(rateKey, {
      resolvers: [resolve],
      rateQueueEntry: entry,
      endsAt: Date.now() + budgetMs
    })
  } else {
    // Add a resolver to existing pair/date entry, and give the key the more
    // generous of the two deadlines: one request serves both callers, and
    // the longer wait is the one someone is still prepared to make.
    rateKeyResolver.resolvers.push(resolve)
    rateKeyResolver.endsAt = Math.max(
      rateKeyResolver.endsAt,
      Date.now() + budgetMs
    )
    // A deadline that only grew needs no timer change: one armed for the
    // old, earlier deadline fires, finds nothing expired, and re-arms.
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
    // The debounce is time this key spends waiting because of the queue's
    // own spacing, not time the caller asked to give up, so the budget
    // starts when the pass does.
    // Not when the caller named its own budget, though: that is a deadline
    // someone is holding a socket open for, and adding the debounce on top
    // would put this key's settle up to a second past it.
    const armed = resolverMap.get(rateKey)
    if (armed != null && chainTimeoutMs == null) {
      armed.endsAt = Date.now() + delay + budgetMs
    }
    queryTimer = setTimeout(() => {
      queryTimer = undefined
      doQuery(doFetch).catch((error: unknown) => {
        // Unlatch before reporting. `inQuery` is set above, and a rejection
        // from anywhere outside `doQuery`'s per-group `try` — building the
        // groups, or stringifying the params — never reaches its terminal
        // branch, which is where a pass clears it. Left latched for the life
        // of the process, every later arrival would take the `!inQuery`
        // false path, arm no timer, and never settle, because
        // `getHistoricalRate` never calls its own `reject`. In the engine
        // that is a `get-transactions` that hangs to the client's deadline,
        // for ever, on a daemon documented as long-lived. One bad pass costs
        // one pass.
        inQuery = false
        lastQueryEndedAt = Date.now()
        settleQueuedAsUnavailable()
        onChainError(error)
      })
    }, delay)
    unrefTimer(queryTimer)
  }
  const queued = resolverMap.get(rateKey)
  if (queued != null) noteDeadline(queued.endsAt)
}

/**
 * Bring the expiry timer forward for a new key's deadline, if it is sooner.
 *
 * O(1) per key. Rescanning the whole queue on every enqueue would be
 * quadratic in a fill, which queues one key per transaction before it awaits
 * anything, so a 10,000-transaction fill would spend seconds on the JS
 * thread before its first request, freezing the GUI's export and stalling
 * every other session in the daemon. The full scan runs only when the timer
 * fires.
 */
function noteDeadline(endsAt: number): void {
  if (endsAt >= expiryTimerAt) return
  if (expiryTimer != null) clearTimeout(expiryTimer)
  expiryTimerAt = endsAt
  expiryTimer = setTimeout(onExpiryTimer, Math.max(0, endsAt - Date.now()))
  unrefTimer(expiryTimer)
}

function onExpiryTimer(): void {
  expiryTimer = undefined
  expiryTimerAt = Infinity
  settleExpiredQueued()
  armExpiryTimer()
}

/**
 * Point `expiryTimer` at the nearest queued deadline, or at nothing.
 *
 * The full scan, so it runs only when the timer fires; an enqueue goes
 * through `noteDeadline`.
 */
function armExpiryTimer(): void {
  let nearest = Infinity
  for (const { endsAt } of resolverMap.values()) {
    if (endsAt < nearest) nearest = endsAt
  }
  if (nearest === expiryTimerAt) return
  if (expiryTimer != null) clearTimeout(expiryTimer)
  expiryTimer = undefined
  expiryTimerAt = nearest
  if (!Number.isFinite(nearest)) return
  expiryTimer = setTimeout(onExpiryTimer, Math.max(0, nearest - Date.now()))
  unrefTimer(expiryTimer)
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
  if (expiryTimer != null) {
    clearTimeout(expiryTimer)
    expiryTimer = undefined
  }
  expiryTimerAt = Infinity
  inQuery = false
  queueStopped = true
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
 * Let the queue take work again after a `stopRateQueue`.
 *
 * Nothing in the engine calls this: `stopRateQueue` runs in `shutdown`, and a
 * process that has closed its context has no use for rates. It is the door a
 * test goes through between cases, and it is a door rather than a side effect
 * of `clearRateCache` so that neither function has to be called for the other
 * one's reason.
 */
export function startRateQueue(): void {
  queueStopped = false
}

/**
 * Whether any queued key still has a caller waiting on it.
 *
 * The chain keeps going while one does, rather than while one deadline — set
 * by whoever armed it — is in the future.
 */
function hasLiveQueuedKey(): boolean {
  const now = Date.now()
  for (const { endsAt } of resolverMap.values()) {
    if (now < endsAt) return true
  }
  return false
}

/**
 * Settle the queued keys whose own deadline has passed, and only those.
 *
 * One caller's spent budget must not settle the *whole* queue, whoever had
 * asked: a 600 s export would be answered `RATE_UNAVAILABLE` by a concurrent
 * 90 s `rates-query` reaching its limit, and told to raise a `--timeout`
 * that was never consulted.
 */
function settleExpiredQueued(): void {
  const now = Date.now()
  for (const [key, { resolvers, endsAt }] of [...resolverMap.entries()]) {
    if (now < endsAt) continue
    resolverMap.delete(key)
    resolvers.forEach(resolve => resolve(RATE_UNAVAILABLE))
  }
}

/**
 * Settle every queued caller with `RATE_UNAVAILABLE` and empty the queue.
 *
 * Reached when the chain outlived its caller, when a pass threw outside its
 * own `try`, and when the queue was stopped — three cases in which nothing
 * was learned about these keys. Not `0`, which is the answer for an asset
 * the server cannot price: an export would write zeros for the tail it
 * never asked about.
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
 * the cached count: an asset with no feed has nothing to show in the rate
 * cache, and this number is what makes it visible rather than silent.
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
  doFetch?: EdgeFetchFunction,
  /**
   * The caller's own deadline, as the crypto accessor takes.
   *
   * Here so the two spellings do not diverge: a caller that has a budget
   * could otherwise pass it to one of them and silently not to the other.
   */
  chainTimeoutMs?: number
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
    doFetch,
    chainTimeoutMs
  )
}

/**
 * A historical crypto rate, with `0` for "no price".
 *
 * The contract every GUI consumer is written against: a rate the server
 * cannot supply and one the queue never got an answer about both arrive as
 * `0`. Callers that divide by it check for zero; what they cannot survive is
 * `RATE_UNAVAILABLE`, which is `NaN` and reaches biggystring as the string
 * `'NaN'`.
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
  doFetch?: EdgeFetchFunction,
  chainTimeoutMs?: number
): Promise<number> => {
  const rate = await getHistoricalFiatRateOrUnavailable(
    fiatCode,
    targetFiat,
    date,
    maxQuerySize,
    doFetch,
    chainTimeoutMs
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
