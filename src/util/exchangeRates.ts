/**
 * Core historical / batched rates against rates3/4 `v3/rates`.
 *
 * Uses Node-safe `network.fetchRates` and `utils.removeIsoPrefix`.
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

import { fetchRates } from './network'
import { removeIsoPrefix } from './utils'

const RATES_SERVER_MAX_QUERY_SIZE = 100
const FETCH_FREQUENCY = 1000
const SHOW_LOGS = false

const clog = SHOW_LOGS ? console.log : (...args: any) => undefined

let onQueryError: (error: unknown) => void = error => {
  console.warn(error)
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
let queryTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Keep a pending debounce from holding a process open.
 *
 * Node's timer has `unref`; React Native's is a number and has none. A
 * debounce should never be the reason a program stays alive — the engine
 * holds a listening socket and the GUI a running app — and in a jest worker
 * an armed timer is a leaked handle that outlives the test.
 */
function unrefTimer(timer: unknown): void {
  if (
    typeof timer === 'object' &&
    timer != null &&
    typeof (timer as { unref?: unknown }).unref === 'function'
  ) {
    ;(timer as { unref: () => void }).unref()
  }
}

/** One upstream request: its parameters, and the queue keys it speaks for. */
interface RateQueryGroup {
  params: RatesParams
  keys: string[]
}

let numDoQuery = 0
const doQuery = async (doFetch?: EdgeFetchFunction): Promise<void> => {
  const n = numDoQuery++
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
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group.params)
    }
    try {
      const response = await fetchRates('v3/rates', options, 5000, doFetch)
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text)
      }
      const cleanedRates = asRatesParams(await response.json())

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

        // `0` means "the server could not price this", not a rate. Caching it
        // would answer `0` for that key for the life of the process, long
        // after the rates server recovered.
        if (rate !== 0) cacheRate(key, rate)
        clog(`${n} deleting ${key}`)
        resolverMap.delete(key)
        resolvers.forEach(r => r(rate))
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.warn(`Error querying rates server ${e.message}`)
      }
      // Give up on this request's own keys only. The queue may also hold keys
      // another group owns and keys that arrived mid-flight, and neither was
      // part of this failure.
      for (const key of group.keys) {
        const pending = resolverMap.get(key)
        if (pending == null) continue
        clog(`${n} throw deleting ${key}`)
        resolverMap.delete(key)
        pending.resolvers.forEach(resolve => resolve(0))
      }
    }
  }

  // Every key this pass asked about has settled, so whatever is left was
  // never sent: the RATES_SERVER_MAX_QUERY_SIZE remainder, or an arrival from
  // during the round trip, which `addToQueue` deliberately does not arm a
  // second timer for. Each pass therefore removes at least the keys it asked
  // about, so this terminates.
  if (resolverMap.size > 0) {
    clog(`${n} Calling doQuery again`)
    await doQuery(doFetch)
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
  doFetch?: EdgeFetchFunction
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
    queryTimer = setTimeout(() => {
      queryTimer = undefined
      doQuery(doFetch).catch((error: unknown) => {
        onQueryError(error)
      })
    }, delay)
    unrefTimer(queryTimer)
  }
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
  // So the next query after a stop is not throttled against a pass that
  // never ran. A test that stops the queue between cases wants the same
  // starting point each time.
  lastQueryEndedAt = 0
  for (const [key, { resolvers }] of [...resolverMap.entries()]) {
    resolverMap.delete(key)
    resolvers.forEach(resolve => resolve(0))
  }
}

/** How many rates are cached. `engine-status` reports it as `rateCachedCount`. */
export function rateCacheSize(): number {
  return rateMap.size
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

export const getHistoricalCryptoRate = async (
  pluginId: string,
  tokenId: EdgeTokenId,
  targetFiat: string,
  date: string,
  maxQuerySize: number = RATES_SERVER_MAX_QUERY_SIZE,
  doFetch?: EdgeFetchFunction
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
    doFetch
  )
}
export const getHistoricalFiatRate = async (
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

const getHistoricalRate = async (
  RatesParams: RatesParams,
  rateKey: string,
  maxQuerySize: number = RATES_SERVER_MAX_QUERY_SIZE,
  doFetch?: EdgeFetchFunction
): Promise<number> => {
  return await new Promise((resolve, reject) => {
    const rate = rateMap.get(rateKey)
    if (rate == null) {
      addToQueue(RatesParams, rateKey, resolve, maxQuerySize, doFetch)
      return
    }

    resolve(rate)
  })
}
