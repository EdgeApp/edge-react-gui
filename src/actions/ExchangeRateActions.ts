import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import type { EdgeAccount, EdgeTokenId } from 'edge-core-js'

import { FIAT_CODES_SYMBOLS } from '../constants/WalletAndCurrencyConstants'
import type { ThunkAction } from '../types/reduxTypes'
import type { GuiExchangeRates, GuiExchangeRatesMap } from '../types/types'
import { currencyPlugins } from '../util/corePlugins'
import {
  asCryptoAsset,
  asRatesParams,
  createRateKey,
  type RatesParams
} from '../util/exchangeRates'
import { fetchRates } from '../util/network'
import { datelog, fixFiatCurrencyCode, removeIsoPrefix } from '../util/utils'

const disklet = makeReactNativeDisklet()
const EXCHANGE_RATES_FILENAME = 'exchangeRates.json'
const RATES_SERVER_MAX_QUERY_SIZE = 100
const HOUR_MS = 1000 * 60 * 60
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

const asExchangeRateCache = asObject(
  asObject({
    expiration: asNumber,
    rate: asNumber
  })
)
const asExchangeRateCacheFile = asObject({
  rates: asExchangeRateCache,
  cryptoPairs: asArray(asCryptoFiatPair),
  fiatPairs: asArray(asFiatFiatPair)
})

// type AssetPair = ReturnType<typeof asAssetPair>
// Exported for unit tests
export type ExchangeRateCache = ReturnType<typeof asExchangeRateCache>
type ExchangeRateCacheFile = ReturnType<typeof asExchangeRateCacheFile>

let exchangeRateCache: ExchangeRateCacheFile | undefined

export function updateExchangeRates(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { defaultIsoFiat } = state.ui.settings
    const now = Date.now()
    const yesterday = getYesterdayDateRoundDownHour(now).toISOString()

    // If this is the first run, immediately use whatever we have on disk
    // before moving on to the potentially slow network:
    if (state.exchangeRatesMap.size === 0 || exchangeRateCache == null) {
      exchangeRateCache = await loadExchangeRateCache().catch(
        (error: unknown) => {
          datelog('Error loading exchange rate cache:', String(error))
          return { rates: {}, cryptoPairs: [], fiatPairs: [] }
        }
      )
      const { exchangeRates, exchangeRatesMap } = buildGuiRates(
        exchangeRateCache.rates,
        yesterday
      )
      dispatch({
        type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
        data: {
          exchangeRates,
          exchangeRatesMap
        }
      })
    }

    // Refresh from the network:
    await fetchExchangeRates(
      account,
      defaultIsoFiat,
      exchangeRateCache,
      now,
      yesterday
    )
    const { exchangeRates, exchangeRatesMap } = buildGuiRates(
      exchangeRateCache.rates,
      yesterday
    )
    dispatch({
      type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
      data: {
        exchangeRates,
        exchangeRatesMap
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
    rates: {}
  }

  const raw = await disklet.getText(EXCHANGE_RATES_FILENAME)
  const json = JSON.parse(raw)
  const { cryptoPairs, fiatPairs, rates } = asExchangeRateCacheFile(json)

  // Keep un-expired asset pairs:
  for (const pair of cryptoPairs) {
    if (pair.expiration < now) continue
    out.cryptoPairs.push(pair)
  }
  for (const pair of fiatPairs) {
    if (pair.expiration < now) continue
    out.fiatPairs.push(pair)
  }

  // Keep un-expired rates:
  for (const key of Object.keys(rates)) {
    if (rates[key].expiration < now) continue
    out.rates[key] = rates[key]
  }

  return out
}

/**
 * Fetches exchange rates from the server, and writes them out to disk.
 */
async function fetchExchangeRates(
  account: EdgeAccount,
  accountFiat: string,
  cache: ExchangeRateCacheFile,
  now: number,
  yesterday: string
): Promise<void> {
  const { currencyWallets } = account

  // Look up various dates:
  const pairExpiration = now + ONE_MONTH
  const rateExpiration = now + ONE_DAY

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
      tokenIdStr = `_${tokenIdStr}`
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
  const rates: ExchangeRateCache = {}
  for (const key of Object.keys(cache.rates)) {
    if (cache.rates[key].expiration < now) continue
    rates[key] = cache.rates[key]
  }

  // If the user's fiat isn't dollars, get it's price:
  if (accountFiat !== 'iso:USD') {
    addFiatPair({
      isoDate: undefined,
      fiatCode: accountFiat,
      targetFiat: 'iso:USD',
      expiration: pairExpiration
    })
  }

  // Grab the assets from all wallets:
  for (const walletId of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[walletId]
    const { currencyCode, pluginId } = wallet.currencyInfo
    const targetFiat = wallet.fiatCurrencyCode
    // Get the primary asset's prices for today and yesterday,
    // but with yesterday's price in dollars:
    addCryptoPair({
      asset: { pluginId, tokenId: null },
      targetFiat,
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
      if (token.currencyCode === currencyCode) continue
      addCryptoPair({
        asset: { pluginId, tokenId },
        targetFiat,
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
  for (const query of requests) {
    // const query = assetPairs.slice(i, i + RATES_SERVER_MAX_QUERY_SIZE)
    for (let attempt = 0; attempt < 5; ++attempt) {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      }
      try {
        const response = await fetchRates('v3/rates', options)
        if (response.ok) {
          const json = await response.json()
          const cleanedRates = asRatesParams(json)

          const allRates = [...cleanedRates.crypto, ...cleanedRates.fiat]
          for (const exchangeRate of allRates) {
            const date = exchangeRate.isoDate?.toISOString()
            const isHistorical =
              date != null && now - new Date(date).valueOf() > HOUR_MS

            const key = createRateKey(
              'asset' in exchangeRate
                ? exchangeRate.asset
                : exchangeRate.fiatCode,
              fixFiatCurrencyCode(cleanedRates.targetFiat),
              isHistorical ? date : undefined
            )

            if (exchangeRate.rate != null) {
              rates[key] = {
                expiration: rateExpiration,
                rate: exchangeRate.rate
              }
            } else {
              // We at least need a placeholder:
              rates[key] ??= {
                expiration: 0,
                rate: 0
              }
            }
          }
          break
        }
      } catch (error: unknown) {
        console.log(
          `buildExchangeRates error querying rates server ${String(error)}`
        )
      }
    }
  }

  // Update the in-memory cache:
  exchangeRateCache = {
    rates,
    cryptoPairs: Array.from(cryptoPairMap.values()),
    fiatPairs: Array.from(fiatPairMap.values())
  }

  // Write the cache to disk:
  await disklet
    .setText(EXCHANGE_RATES_FILENAME, JSON.stringify(exchangeRateCache))
    .catch((error: unknown) => {
      datelog('Error saving exchange rate cache:', String(error))
    })
}

export const decodeRateKey = (
  rateKey: string
):
  | {
      asset: { pluginId: string; tokenId?: EdgeTokenId } | string
      targetFiat: string
      date?: string
    }
  | undefined => {
  const args = rateKey.split('_')
  if (args.length === 2) {
    // fiat_fiat or crypto_fiat
    const asset = args[0]
    const targetFiat = args[1]

    if (FIAT_CODES_SYMBOLS[removeIsoPrefix(asset)] != null) {
      return {
        asset,
        targetFiat,
        date: undefined
      }
    } else {
      return {
        asset: { pluginId: asset },
        targetFiat,
        date: undefined
      }
    }
  } else if (args.length === 3) {
    // fiat_fiat_date or pluginId_fiat_date or pluginId_tokenId_fiat
    const [codeA, codeB, codeC] = args
    if (FIAT_CODES_SYMBOLS[removeIsoPrefix(codeA)] != null) {
      return {
        asset: codeA,
        targetFiat: codeB,
        date: codeC
      }
    } else if (
      FIAT_CODES_SYMBOLS[removeIsoPrefix(codeB)] != null &&
      currencyPlugins[codeA] != null
    ) {
      return {
        asset: { pluginId: codeA },
        targetFiat: codeB,
        date: codeC
      }
    } else if (
      FIAT_CODES_SYMBOLS[removeIsoPrefix(codeC)] != null &&
      currencyPlugins[codeA] != null
    ) {
      return {
        asset: { pluginId: codeA, tokenId: codeB },
        targetFiat: codeC,
        date: undefined
      }
    }
  } else if (args.length === 4) {
    // pluginId/tokenId/fiat/date
    const [codeA, codeB, codeC, codeD] = args
    if (
      FIAT_CODES_SYMBOLS[removeIsoPrefix(codeC)] != null &&
      currencyPlugins[codeA] != null
    )
      return {
        asset: { pluginId: codeA, tokenId: codeB },
        targetFiat: codeC,
        date: codeD
      }
  }
}

/**
 * Converts rates from the cache format to the GUI's in-memory format.
 */
function buildGuiRates(
  rateCache: ExchangeRateCache,
  yesterday: string
): { exchangeRates: GuiExchangeRates; exchangeRatesMap: GuiExchangeRatesMap } {
  const out: GuiExchangeRates = { 'iso:USD_iso:USD': 1 }
  const outMap: GuiExchangeRatesMap = new Map()
  const yesterdayTimestamp = Date.parse(yesterday)

  for (const key of Object.keys(rateCache)) {
    const { rate } = rateCache[key]
    out[key] = rate

    const assetObj = decodeRateKey(key)
    if (assetObj == null) continue

    const rateKeyWithoutDate = createRateKey(
      assetObj.asset,
      assetObj.targetFiat
    )

    const args = rateKeyWithoutDate.split('_')

    const targetFiat: string = args.pop() ?? ''

    const assetString = args.join('_')

    // Set up exchange rate map. This nest map is keyed This map will hold current rate and 24 hour rate, if available.
    if (
      outMap.get(assetString)?.get(targetFiat) != null ||
      assetObj.date != null
    ) {
      continue
    }

    let yesterdayRate: number | undefined
    // We only look up yesterday's rate for USD pairs
    if (targetFiat === 'iso:USD') {
      yesterdayRate =
        rateCache[rateKeyWithoutDate]?.rate ??
        closestRateForTimestamp(rateCache, assetString, yesterdayTimestamp)
    }

    const codeAMap = outMap.get(assetString) ?? new Map()
    outMap.set(
      assetString,
      codeAMap.set(targetFiat, { currentRate: rate, yesterdayRate })
    )
  }

  return {
    exchangeRates: out,
    exchangeRatesMap: outMap
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

export const closestRateForTimestamp = (
  exchangeRates: ExchangeRateCache,
  assetString: string,
  timestamp: number
): number | undefined => {
  // The extra _ at the end means there is a date string at the end of the key
  const filteredPairs = Object.keys(exchangeRates).filter(pair =>
    pair.startsWith(`${assetString}_iso:USD_`)
  )

  let bestRate: number | undefined
  let bestDistance = Infinity
  for (const pair of filteredPairs) {
    const args = pair.split('_')
    const date = args.pop() ?? ''
    if (isNaN(Date.parse(date))) continue

    const ms = Date.parse(date).valueOf()
    const distance = Math.abs(ms - timestamp)
    if (distance < bestDistance) {
      bestDistance = distance
      bestRate = exchangeRates[pair].rate
    }
  }
  return bestRate
}

/**
 * Convert maps to an array of RatesParams objects grouped by targetFiat.
 */
function convertToRatesParams(
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

  const newDate = new Date()
  for (const [targetFiat, { crypto, fiat }] of resultMap.entries()) {
    while (crypto.length > 0 || fiat.length > 0) {
      const cryptoChunk = crypto.splice(0, RATES_SERVER_MAX_QUERY_SIZE)
      const fiatChunk = fiat.splice(0, RATES_SERVER_MAX_QUERY_SIZE)

      requests.push({
        targetFiat,
        crypto: cryptoChunk.map(pair => ({
          isoDate: pair.isoDate == null ? newDate : new Date(pair.isoDate),
          asset: pair.asset,
          rate: undefined
        })),
        fiat: fiatChunk.map(pair => ({
          isoDate: pair.isoDate == null ? newDate : new Date(pair.isoDate),
          fiatCode: pair.fiatCode,
          rate: undefined
        }))
      })
    }
  }

  return requests
}
