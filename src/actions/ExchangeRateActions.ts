import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import type { EdgeAccount } from 'edge-core-js'

import type { ThunkAction } from '../types/reduxTypes'
import {
  asCryptoAsset,
  asRatesParams,
  type RatesParams
} from '../util/exchangeRates'
import { log } from '../util/logger'
import { fetchRates } from '../util/network'
import { datelog, fixFiatCurrencyCode, removeIsoPrefix } from '../util/utils'

const disklet = makeReactNativeDisklet()
const EXCHANGE_RATES_FILENAME = 'exchangeRates.json'
const RATES_SERVER_MAX_QUERY_SIZE = 100
const ONE_HOUR = 1000 * 60 * 60
const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_MONTH = 1000 * 60 * 60 * 24 * 30

const asCryptoFiatPair = asObject({
  asset: asCryptoAsset,
  targetFiat: asString,
  isoDate: asOptional(asString), // Defaults to today if not specified
  expiration: asNumber
})
type CryptoFiatPair = ReturnType<typeof asCryptoFiatPair>
const asFiatFiatPair = asObject({
  fiatCode: asString,
  targetFiat: asString,
  isoDate: asOptional(asString), // Defaults to today if not specified
  expiration: asNumber
})
type FiatFiatPair = ReturnType<typeof asFiatFiatPair>

const asExchangeRateCache = asObject({
  // { pluginId: { tokenId: { targetFiat: { current: number, yesterday: number, expiration: number } } } }
  crypto: asObject(
    asObject(
      asObject(
        asObject({
          current: asNumber,
          yesterday: asNumber,
          yesterdayTimestamp: asNumber,
          expiration: asNumber
        })
      )
    )
  ),
  // { fiatCode: { targetFiat: { current: number, yesterday: number, expiration: number } } }
  fiat: asObject(
    asObject(
      asObject({
        current: asNumber,
        yesterday: asNumber,
        yesterdayTimestamp: asNumber,
        expiration: asNumber
      })
    )
  )
})

const asExchangeRateCacheFile = asObject({
  rates: asExchangeRateCache,
  cryptoPairs: asArray(asCryptoFiatPair),
  fiatPairs: asArray(asFiatFiatPair)
})

// Exported for unit tests
export type ExchangeRateCache = ReturnType<typeof asExchangeRateCache>
export type GuiExchangeRates = ExchangeRateCache
type ExchangeRateCacheFile = ReturnType<typeof asExchangeRateCacheFile>

let exchangeRateCache: ExchangeRateCacheFile | undefined

/**
 * Returns the in-memory exchange-rate cache, including the subscribed
 * pair lists, for inclusion in support log output. The logged blob can be
 * replayed against the rates server with `scripts/ratesCacheReplay.ts`.
 */
export function getExchangeRateCacheDump(): ExchangeRateCacheFile | undefined {
  return exchangeRateCache
}

export function updateExchangeRates(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account, context } = state.core
    const { defaultIsoFiat } = state.ui.settings
    const verbose = context.logSettings?.defaultLogLevel === 'info'
    const now = Date.now()
    const yesterday = getYesterdayDateRoundDownHour(now).toISOString()

    // If this is the first run, immediately use whatever we have on disk
    // before moving on to the potentially slow network:
    if (
      Object.keys(state.exchangeRates.crypto).length === 0 ||
      exchangeRateCache == null
    ) {
      exchangeRateCache = await loadExchangeRateCache().catch(
        (error: unknown) => {
          datelog('Error loading exchange rate cache:', String(error))
          return {
            cryptoPairs: [],
            fiatPairs: [],
            rates: { crypto: {}, fiat: {} }
          }
        }
      )

      dispatch({
        type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
        data: {
          exchangeRates: exchangeRateCache.rates
        }
      })
    }

    // Refresh from the network:
    await fetchExchangeRates(
      account,
      defaultIsoFiat,
      exchangeRateCache,
      now,
      yesterday,
      verbose
    )

    dispatch({
      type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
      data: {
        exchangeRates: exchangeRateCache.rates
      }
    })
  }
}

/**
 * Loads the exchange rate cache from disk, and deletes expired entries.
 */
async function loadExchangeRateCache(): Promise<ExchangeRateCacheFile> {
  const now = Date.now()
  const out: ExchangeRateCacheFile = {
    cryptoPairs: [],
    fiatPairs: [],
    rates: { crypto: {}, fiat: {} }
  }

  const raw = await disklet.getText(EXCHANGE_RATES_FILENAME)
  const json = JSON.parse(raw)
  const { cryptoPairs, fiatPairs, rates } = asExchangeRateCacheFile(json)

  // Keep un-expired asset pairs:
  const cryptoPairsMap = new Map<string, CryptoFiatPair>()
  for (const pair of cryptoPairs) {
    if (pair.expiration < now) continue
    const tokenIdStr =
      pair.asset.tokenId != null ? `_${pair.asset.tokenId}` : ''
    const key = `${pair.asset.pluginId}${tokenIdStr}_${pair.targetFiat}`
    cryptoPairsMap.set(key, { ...pair, isoDate: undefined })
  }
  out.cryptoPairs = Array.from(cryptoPairsMap.values())

  const fiatPairsMap = new Map<string, FiatFiatPair>()
  for (const pair of fiatPairs) {
    if (pair.expiration < now) continue
    const key = `${pair.fiatCode}_${pair.targetFiat}`
    fiatPairsMap.set(key, { ...pair, isoDate: undefined })
  }
  out.fiatPairs = Array.from(fiatPairsMap.values())

  // Keep un-expired rates:
  for (const [pluginId, tokenObj] of Object.entries(rates.crypto)) {
    for (const [tokenId, fiatObj] of Object.entries(tokenObj)) {
      for (const [fiat, rateObj] of Object.entries(fiatObj)) {
        if (rateObj.expiration < now) continue
        out.rates.crypto[pluginId] ??= {}
        out.rates.crypto[pluginId][tokenId] ??= {}
        out.rates.crypto[pluginId][tokenId][fiat] = rateObj
      }
    }
  }
  for (const [fiat, targetFiatObj] of Object.entries(rates.fiat)) {
    for (const [targetFiat, rateObj] of Object.entries(targetFiatObj)) {
      if (rateObj.expiration < now) continue
      out.rates.fiat[fiat] ??= {}
      out.rates.fiat[fiat][targetFiat] = rateObj
    }
  }

  return out
}

/**
 * Fetches exchange rates from the server, and writes them out to disk.
 * When `verbose` is set, requested pairs, resolved pairs, and errors are
 * written to the captured logs.
 */
async function fetchExchangeRates(
  account: EdgeAccount,
  accountIsoFiat: string,
  cache: ExchangeRateCacheFile,
  now: number,
  yesterday: string,
  verbose: boolean
): Promise<void> {
  const { currencyWallets } = account

  // Look up various dates:
  const pairExpiration = now + ONE_MONTH
  const rateExpiration = now + ONE_DAY
  const yesterdayTimestamp = Date.parse(yesterday)

  // Maintain a map of the unique asset pairs we need:
  const cryptoPairMap = new Map<string, CryptoFiatPair>()
  const fiatPairMap = new Map<string, FiatFiatPair>()

  function addCryptoPair(pair: CryptoFiatPair): void {
    let dateStr = ''
    if (pair.isoDate != null) {
      dateStr = `_${pair.isoDate}`
    }

    let tokenIdStr = ''
    if (pair.asset.tokenId != null) {
      tokenIdStr = `_${pair.asset.tokenId}`
    }
    const key = `${pair.asset.pluginId}${tokenIdStr}_${pair.targetFiat}${dateStr}`
    cryptoPairMap.set(key, pair)
  }
  function addFiatPair(pair: FiatFiatPair): void {
    let dateStr = ''
    if (pair.isoDate != null) {
      dateStr = `_${pair.isoDate}`
    }
    const key = `${pair.fiatCode}_${pair.targetFiat}${dateStr}`
    fiatPairMap.set(key, pair)
  }

  // Keep the cached asset list, in case any wallets are still loading:
  for (const pair of cache.cryptoPairs) {
    if (pair.expiration < now) continue
    addCryptoPair(pair)
  }
  for (const pair of cache.fiatPairs) {
    if (pair.expiration < now) continue
    addFiatPair(pair)
  }

  // Keep any un-expired rates, although they are likely to be stomped:
  const rates: ExchangeRateCache = {
    crypto: {},
    fiat: {
      'iso:USD': {
        'iso:USD': {
          current: 1,
          yesterday: 1,
          yesterdayTimestamp: 1,
          expiration: 1
        }
      }
    }
  }
  for (const [pluginId, tokenObj] of Object.entries(cache.rates.crypto)) {
    for (const [tokenId, fiatObj] of Object.entries(tokenObj)) {
      for (const [fiat, rateObj] of Object.entries(fiatObj)) {
        if (rateObj.expiration < now) continue
        rates.crypto[pluginId] ??= {}
        rates.crypto[pluginId][tokenId] ??= {}
        rates.crypto[pluginId][tokenId][fiat] ??= {
          ...rateObj
        }
      }
    }
  }
  for (const [fiatCode, targetFiatObj] of Object.entries(cache.rates.fiat)) {
    for (const [targetFiat, rateObj] of Object.entries(targetFiatObj)) {
      if (rateObj.expiration < now) continue
      rates.fiat[fiatCode] ??= {}
      rates.fiat[fiatCode][targetFiat] ??= {
        ...rateObj
      }
    }
  }

  // If the user's fiat isn't dollars, get it's price:
  if (accountIsoFiat !== 'iso:USD') {
    addFiatPair({
      isoDate: undefined,
      fiatCode: accountIsoFiat,
      targetFiat: 'iso:USD',
      expiration: pairExpiration
    })
  }

  // Grab the assets from all wallets:
  for (const walletId of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[walletId]
    const { pluginId } = wallet.currencyInfo
    // Get the primary asset's prices for today and yesterday,
    // but with yesterday's price in dollars:
    addCryptoPair({
      asset: { pluginId, tokenId: null },
      targetFiat: 'iso:USD',
      isoDate: undefined,
      expiration: pairExpiration
    })
    addCryptoPair({
      asset: { pluginId, tokenId: null },
      targetFiat: 'iso:USD',
      isoDate: yesterday,
      expiration: pairExpiration
    })

    // Do the same for any tokens:
    for (const tokenId of wallet.enabledTokenIds) {
      const token = wallet.currencyConfig.allTokens[tokenId]
      if (token == null) continue
      addCryptoPair({
        asset: { pluginId, tokenId },
        targetFiat: 'iso:USD',
        isoDate: undefined,
        expiration: pairExpiration
      })
      addCryptoPair({
        asset: { pluginId, tokenId },
        targetFiat: 'iso:USD',
        isoDate: yesterday,
        expiration: pairExpiration
      })
    }
  }

  const requests = convertToRatesParams(cryptoPairMap, fiatPairMap)
  const promises = requests.map(async (query, queryIndex) => {
    // Log the exact request body so it can be replayed verbatim against the
    // rates server (e.g. `curl -X POST .../v3/rates -d <body>`):
    const body = JSON.stringify(query)
    if (verbose) {
      log(`rates query ${queryIndex} request: ${body}`)
    }
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    }
    try {
      const response = await fetchRates('v3/rates', options)
      if (response.ok) {
        const json = await response.json()
        const cleanedRates = asRatesParams(json)
        const targetFiat = fixFiatCurrencyCode(cleanedRates.targetFiat)

        if (verbose) {
          // The requested pairs are already logged above (request body), so
          // here we only summarize the outcome and name the pairs the server
          // returned without a rate:
          let resolvedCount = 0
          const noRateKeys: string[] = []
          for (const entry of cleanedRates.crypto) {
            if (entry.rate != null) resolvedCount++
            else
              noRateKeys.push(cryptoRateLogKey(entry, cleanedRates.targetFiat))
          }
          for (const entry of cleanedRates.fiat) {
            if (entry.rate != null) resolvedCount++
            else noRateKeys.push(fiatRateLogKey(entry, cleanedRates.targetFiat))
          }
          log(
            `rates query ${queryIndex} result: ${resolvedCount} resolved, ${
              noRateKeys.length
            } no-rate${
              noRateKeys.length > 0 ? `: ${noRateKeys.join(', ')}` : ''
            }`
          )
        }

        for (const cryptoRate of cleanedRates.crypto) {
          const { asset, isoDate, rate } = cryptoRate
          if (rate == null) continue

          const { pluginId, tokenId } = asset
          const safeTokenId = tokenId ?? ''

          rates.crypto[pluginId] ??= {}
          rates.crypto[pluginId][safeTokenId] ??= {}
          rates.crypto[pluginId][safeTokenId][targetFiat] ??= {
            current: 0,
            yesterday: 0,
            yesterdayTimestamp: 0,
            expiration: 0
          }

          const rateObj = rates.crypto[pluginId][safeTokenId][targetFiat]

          const isHistorical =
            isoDate != null && isoDate.getTime() < now - ONE_HOUR
          if (isHistorical) {
            const dateTimestamp = isoDate.getTime()
            const yesterdayTargetTimestamp = Date.parse(yesterday)
            const yesterdayRateTimestamp = rateObj.yesterdayTimestamp

            // update yesterday rate if we find one closer than we have
            if (
              Math.abs(yesterdayTargetTimestamp - dateTimestamp) <
              Math.abs(yesterdayTargetTimestamp - yesterdayRateTimestamp)
            ) {
              rates.crypto[pluginId][safeTokenId][
                targetFiat
              ].yesterdayTimestamp = yesterdayTimestamp
              rateObj.yesterday = rate
            }
          } else {
            rateObj.current = rate
          }

          rateObj.expiration = rateExpiration
        }
        for (const fiatRate of cleanedRates.fiat) {
          const { isoDate, rate } = fiatRate
          const fiatCode = fixFiatCurrencyCode(fiatRate.fiatCode)
          if (rate == null) continue

          rates.fiat[fiatCode] ??= {}
          rates.fiat[fiatCode][targetFiat] ??= {
            current: 0,
            yesterday: 0,
            yesterdayTimestamp: 0,
            expiration: 0
          }
          const rateObj = rates.fiat[fiatCode][targetFiat]

          const isHistorical =
            isoDate != null && isoDate.getTime() < now - ONE_HOUR
          if (isHistorical) {
            const dateTimestamp = isoDate.getTime()
            const yesterdayTargetTimestamp = Date.parse(yesterday)
            const yesterdayRateTimestamp = rateObj.yesterdayTimestamp

            // update yesterday rate if we find one closer than we have
            if (
              Math.abs(yesterdayTargetTimestamp - dateTimestamp) <
              Math.abs(yesterdayTargetTimestamp - yesterdayRateTimestamp)
            ) {
              rates.fiat[fiatCode][targetFiat].yesterdayTimestamp =
                yesterdayTimestamp
              rateObj.yesterday = rate
            }
          } else {
            rateObj.current = rate
          }

          rateObj.expiration = rateExpiration
        }
      } else if (verbose) {
        const text = await response.text()
        log(
          `rates query ${queryIndex} failed: HTTP ${
            response.status
          }: ${text.slice(0, 200)}`
        )
      }
    } catch (error: unknown) {
      if (verbose) {
        // Pass an Error through as-is: `log` renders it with its stack, which
        // names the call site that failed. Stringifying it here would lose that.
        log(
          `rates query ${queryIndex} error:`,
          error instanceof Error ? error : String(error)
        )
      }
      console.log(
        `buildExchangeRates error querying rates server ${String(error)}`
      )
    }
  })
  await Promise.allSettled(promises)

  // Merge successful rate responses into the pair cache
  const { cryptoPairs: cryptoPairCache, fiatPairs: fiatPairCache } =
    mergePairCache(
      rates,
      {
        cryptoPairs: exchangeRateCache?.cryptoPairs ?? [],
        fiatPairs: exchangeRateCache?.fiatPairs ?? []
      },
      pairExpiration
    )

  // Update the in-memory cache:
  exchangeRateCache = {
    rates,
    cryptoPairs: cryptoPairCache,
    fiatPairs: fiatPairCache
  }

  // Write the cache to disk:
  await disklet
    .setText(EXCHANGE_RATES_FILENAME, JSON.stringify(exchangeRateCache))
    .catch((error: unknown) => {
      datelog('Error saving exchange rate cache:', String(error))
    })
}

/**
 * Key for a crypto pair. A missing `tokenId` and an explicit `null` both mean
 * "the chain's own asset", so they must produce the same key — this matches
 * how `loadExchangeRateCache` de-duplicates the pairs it reads from disk.
 */
const cryptoPairKey = (
  pluginId: string,
  tokenId: string | null | undefined,
  targetFiat: string
): string => `${pluginId}${tokenId != null ? `_${tokenId}` : ''}_${targetFiat}`

const fiatPairKey = (fiatCode: string, targetFiat: string): string =>
  `${fiatCode}_${targetFiat}`

/**
 * Merges the assets we just fetched rates for into the subscribed pair lists.
 *
 * Pairs are keyed rather than matched by a linear scan, so an entry stored
 * without a `tokenId` key and one stored with an explicit `null` collapse into
 * a single pair. Comparing the two with `===` treated them as different
 * assets, which appended a duplicate for every chain's own asset on each
 * refresh and inflated later rate queries.
 *
 * Exported for unit tests.
 */
export function mergePairCache(
  rates: ExchangeRateCache,
  previous: { cryptoPairs: CryptoFiatPair[]; fiatPairs: FiatFiatPair[] },
  pairExpiration: number
): { cryptoPairs: CryptoFiatPair[]; fiatPairs: FiatFiatPair[] } {
  const cryptoPairs = new Map<string, CryptoFiatPair>()
  for (const pair of previous.cryptoPairs) {
    const key = cryptoPairKey(
      pair.asset.pluginId,
      pair.asset.tokenId,
      pair.targetFiat
    )
    cryptoPairs.set(key, pair)
  }
  for (const [pluginId, tokenObj] of Object.entries(rates.crypto)) {
    for (const [tokenId, rateObj] of Object.entries(tokenObj)) {
      for (const targetFiat of Object.keys(rateObj)) {
        const edgeTokenId = tokenId === '' ? null : tokenId
        cryptoPairs.set(cryptoPairKey(pluginId, edgeTokenId, targetFiat), {
          asset: { pluginId, tokenId: edgeTokenId },
          targetFiat,
          isoDate: undefined,
          expiration: pairExpiration
        })
      }
    }
  }

  const fiatPairs = new Map<string, FiatFiatPair>()
  for (const pair of previous.fiatPairs) {
    fiatPairs.set(fiatPairKey(pair.fiatCode, pair.targetFiat), pair)
  }
  for (const [fiatCode, fiatObj] of Object.entries(rates.fiat)) {
    for (const targetFiat of Object.keys(fiatObj)) {
      fiatPairs.set(fiatPairKey(fiatCode, targetFiat), {
        fiatCode,
        targetFiat,
        isoDate: undefined,
        expiration: pairExpiration
      })
    }
  }

  return {
    cryptoPairs: Array.from(cryptoPairs.values()),
    fiatPairs: Array.from(fiatPairs.values())
  }
}

const getYesterdayDateRoundDownHour = (now?: Date | number): Date => {
  const yesterday = now == null ? new Date() : new Date(now)
  yesterday.setMinutes(0)
  yesterday.setSeconds(0)
  yesterday.setMilliseconds(0)
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday
}

/**
 * Compact log key for a crypto rate entry:
 * `pluginId[_tokenId]_targetFiat[@isoDate]`
 */
function cryptoRateLogKey(
  entry: RatesParams['crypto'][number],
  targetFiat: string
): string {
  const { asset, isoDate } = entry
  const tokenIdStr = asset.tokenId != null ? `_${asset.tokenId}` : ''
  const dateStr = isoDate != null ? `@${isoDate.toISOString()}` : ''
  return `${asset.pluginId}${tokenIdStr}_${targetFiat}${dateStr}`
}

/**
 * Compact log key for a fiat rate entry: `fiatCode_targetFiat[@isoDate]`
 */
function fiatRateLogKey(
  entry: RatesParams['fiat'][number],
  targetFiat: string
): string {
  const dateStr = entry.isoDate != null ? `@${entry.isoDate.toISOString()}` : ''
  return `${entry.fiatCode}_${targetFiat}${dateStr}`
}

/**
 * Convert maps to an array of RatesParams objects grouped by targetFiat.
 */
export function convertToRatesParams(
  cryptoPairMap: Map<string, CryptoFiatPair>,
  fiatPairMap: Map<string, FiatFiatPair>
): RatesParams[] {
  const resultMap = new Map<
    string,
    { crypto: CryptoFiatPair[]; fiat: FiatFiatPair[] }
  >()

  // Group CryptoPairs by targetFiat
  for (const pair of cryptoPairMap.values()) {
    const targetFiat = pair.targetFiat
    if (!resultMap.has(targetFiat)) {
      resultMap.set(targetFiat, { crypto: [], fiat: [] })
    }
    resultMap.get(targetFiat)!.crypto.push(pair)
  }

  // Group FiatPairs by targetFiat
  for (const pair of fiatPairMap.values()) {
    const targetFiat = pair.targetFiat
    if (!resultMap.has(targetFiat)) {
      resultMap.set(targetFiat, { crypto: [], fiat: [] })
    }
    resultMap.get(targetFiat)!.fiat.push(pair)
  }

  // Convert to RatesParams[]
  const requests: RatesParams[] = []

  for (const [targetFiat, { crypto, fiat }] of resultMap.entries()) {
    while (crypto.length > 0 || fiat.length > 0) {
      const cryptoChunk = crypto.splice(0, RATES_SERVER_MAX_QUERY_SIZE)
      const fiatChunk = fiat.splice(0, RATES_SERVER_MAX_QUERY_SIZE)

      // Leave `isoDate` off of "current" pairs (those with no date) so the
      // rates server timestamps them with its own clock. Stamping the device
      // clock here asked the server for a future date whenever the device ran
      // fast, and the server returns no rate for future dates, which left the
      // current rate at 0 and fiat balances stuck at $0.00. Historical pairs
      // keep their explicit date.
      requests.push({
        targetFiat: removeIsoPrefix(targetFiat),
        crypto: cryptoChunk.map(pair => ({
          isoDate: pair.isoDate == null ? undefined : new Date(pair.isoDate),
          asset: pair.asset,
          rate: undefined
        })),
        fiat: fiatChunk.map(pair => ({
          isoDate: pair.isoDate == null ? undefined : new Date(pair.isoDate),
          fiatCode: removeIsoPrefix(pair.fiatCode),
          rate: undefined
        }))
      })
    }
  }

  return requests
}
