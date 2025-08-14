import {
  asArray,
  asEither,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import type { EdgeAccount } from 'edge-core-js'

import type { ThunkAction } from '../types/reduxTypes'
import type { GuiExchangeRates, GuiExchangeRatesMap } from '../types/types'
import { fetchRates } from '../util/network'
import { datelog } from '../util/utils'

const disklet = makeReactNativeDisklet()
const EXCHANGE_RATES_FILENAME = 'exchangeRates.json'
const RATES_SERVER_MAX_QUERY_SIZE = 100
const HOUR_MS = 1000 * 60 * 60
const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_MONTH = 1000 * 60 * 60 * 24 * 30

const asAssetPair = asObject({
  currency_pair: asString,
  date: asOptional(asString), // Defaults to today if not specified
  expiration: asNumber
})

const asExchangeRateCache = asObject(
  asObject({
    expiration: asNumber,
    rate: asNumber
  })
)
const asExchangeRateCacheFile = asObject({
  rates: asExchangeRateCache,
  assetPairs: asArray(asAssetPair)
})

type AssetPair = ReturnType<typeof asAssetPair>
// Exported for unit tests
export type ExchangeRateCache = ReturnType<typeof asExchangeRateCache>
type ExchangeRateCacheFile = ReturnType<typeof asExchangeRateCacheFile>

let exchangeRateCache: ExchangeRateCacheFile | undefined

const asRatesResponse = asObject({
  data: asArray(
    asObject({
      currency_pair: asString,
      date: asString,
      exchangeRate: asEither(asString, asNull)
    })
  )
})

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
      exchangeRateCache = await loadExchangeRateCache().catch(error => {
        datelog('Error loading exchange rate cache:', String(error))
        return { assetPairs: [], rates: {} }
      })
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
    assetPairs: [],
    rates: {}
  }

  const raw = await disklet.getText(EXCHANGE_RATES_FILENAME)
  const json = JSON.parse(raw)
  const { assetPairs, rates } = asExchangeRateCacheFile(json)

  // Keep un-expired asset pairs:
  for (const pair of assetPairs) {
    if (pair.expiration < now) continue
    out.assetPairs.push(pair)
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
  accountIsoFiat: string,
  cache: ExchangeRateCacheFile,
  now: number,
  yesterday: string
): Promise<void> {
  const { currencyWallets } = account

  // Look up various dates:
  const pairExpiration = now + ONE_MONTH
  const rateExpiration = now + ONE_DAY

  // Maintain a map of the unique asset pairs we need:
  const assetPairMap = new Map<string, AssetPair>()
  function addAssetPair(assetPair: AssetPair) {
    const key = `${assetPair.currency_pair}_${assetPair.date ?? ''}`
    assetPairMap.set(key, assetPair)
  }

  // Keep the cached asset list, in case any wallets are still loading:
  for (const assetPair of cache.assetPairs) {
    if (assetPair.expiration < now) continue
    addAssetPair(assetPair)
  }

  // Keep any un-expired rates, although they are likely to be stomped:
  const rates: ExchangeRateCache = {}
  for (const key of Object.keys(cache.rates)) {
    if (cache.rates[key].expiration < now) continue
    rates[key] = cache.rates[key]
  }

  // If the user's fiat isn't dollars, get it's price:
  if (accountIsoFiat !== 'iso:USD') {
    addAssetPair({
      currency_pair: `iso:USD_${accountIsoFiat}`,
      date: undefined,
      expiration: pairExpiration
    })
  }

  // Grab the assets from all wallets:
  for (const walletId of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[walletId]
    const { currencyCode } = wallet.currencyInfo

    // Get the primary asset's prices for today and yesterday,
    // but with yesterday's price in dollars:
    addAssetPair({
      currency_pair: `${currencyCode}_${accountIsoFiat}`,
      date: undefined,
      expiration: pairExpiration
    })
    addAssetPair({
      currency_pair: `${currencyCode}_iso:USD`,
      date: yesterday,
      expiration: pairExpiration
    })

    // Do the same for any tokens:
    for (const tokenId of wallet.enabledTokenIds) {
      const token = wallet.currencyConfig.allTokens[tokenId]
      if (token == null) continue
      if (token.currencyCode === currencyCode) continue
      addAssetPair({
        currency_pair: `${token.currencyCode}_${accountIsoFiat}`,
        date: undefined,
        expiration: pairExpiration
      })
      addAssetPair({
        currency_pair: `${token.currencyCode}_iso:USD`,
        date: yesterday,
        expiration: pairExpiration
      })
    }
  }

  const assetPairs = [...assetPairMap.values()]
  for (let i = 0; i < assetPairs.length; i += RATES_SERVER_MAX_QUERY_SIZE) {
    const query = assetPairs.slice(i, i + RATES_SERVER_MAX_QUERY_SIZE)

    for (let attempt = 0; attempt < 5; ++attempt) {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: query })
      }
      try {
        const response = await fetchRates('v2/exchangeRates', options)
        if (response.ok) {
          const json = await response.json()
          const cleanedRates = asRatesResponse(json)
          for (const rate of cleanedRates.data) {
            const { currency_pair: currencyPair, exchangeRate, date } = rate
            const isHistorical = now - new Date(date).valueOf() > HOUR_MS
            const key = isHistorical ? `${currencyPair}_${date}` : currencyPair

            if (exchangeRate != null) {
              rates[key] = {
                expiration: rateExpiration,
                rate: parseFloat(exchangeRate)
              }
            } else if (rates[key] == null) {
              // We at least need a placeholder:
              rates[key] = {
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
  exchangeRateCache = { rates, assetPairs }

  // Write the cache to disk:
  await disklet
    .setText(EXCHANGE_RATES_FILENAME, JSON.stringify(exchangeRateCache))
    .catch(error => {
      datelog('Error saving exchange rate cache:', String(error))
    })
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

    // Include reverse rates:
    const [codeA, codeB, date] = key.split('_') as [
      string,
      string,
      string | undefined
    ]
    const reverseKey = `${codeB}_${codeA}${date ? '_' + date : ''}`
    out[reverseKey] = rate === 0 ? 0 : 1 / rate

    // Set up exchange rate map. This nest map is keyed This map will hold current rate and 24 hour rate, if available.
    if (outMap.get(codeA)?.get(codeB) != null || date != null) {
      continue
    }

    let yesterdayRate: number | undefined
    // We only look up yesterday's rate for USD pairs
    if (codeB === 'iso:USD') {
      yesterdayRate =
        rateCache[`${codeA}_${codeB}_${yesterday}`]?.rate ??
        closestRateForTimestamp(rateCache, codeA, yesterdayTimestamp)
    }

    const codeAMap = outMap.get(codeA) ?? new Map()
    outMap.set(codeA, codeAMap.set(codeB, { currentRate: rate, yesterdayRate }))

    const codeBMap = outMap.get(codeB) ?? new Map()
    outMap.set(
      codeB,
      codeBMap.set(codeA, {
        currentRate: out[reverseKey],
        yesterdayRate:
          yesterdayRate === 0 || yesterdayRate == null ? 0 : 1 / yesterdayRate
      })
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
  currencyCode: string,
  timestamp: number
): number | undefined => {
  // The extra _ at the end means there is a date string at the end of the key
  const filteredPairs = Object.keys(exchangeRates).filter(pair =>
    pair.startsWith(`${currencyCode}_iso:USD_`)
  )

  let bestRate: number | undefined
  let bestDistance = Infinity
  for (const pair of filteredPairs) {
    const [, , date] = pair.split('_')
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
 * Fetches exchange rates for a specific fiat currency on demand.
 * This is used when the user wants to view rates in a currency other than their default.
 */
export function fetchExchangeRatesForFiat(
  fiatCurrencyCode: string
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account
    const now = Date.now()
    const yesterday = getYesterdayDateRoundDownHour(now).toISOString()

    // Build asset pairs for the requested fiat currency
    const assetPairs: AssetPair[] = []
    const pairExpiration = now + ONE_MONTH
    const rateExpiration = now + ONE_DAY

    // If the fiat isn't dollars, get its price relative to USD
    if (fiatCurrencyCode !== 'iso:USD') {
      assetPairs.push({
        currency_pair: `iso:USD_${fiatCurrencyCode}`,
        date: undefined,
        expiration: pairExpiration
      })
    }

    // Get rates for all wallet assets
    for (const walletId of Object.keys(currencyWallets)) {
      const wallet = currencyWallets[walletId]
      const { currencyCode } = wallet.currencyInfo

      // Get the primary asset's prices for today
      assetPairs.push({
        currency_pair: `${currencyCode}_${fiatCurrencyCode}`,
        date: undefined,
        expiration: pairExpiration
      })

      // Do the same for any tokens
      for (const tokenId of wallet.enabledTokenIds) {
        const token = wallet.currencyConfig.allTokens[tokenId]
        if (token == null) continue
        if (token.currencyCode === currencyCode) continue
        assetPairs.push({
          currency_pair: `${token.currencyCode}_${fiatCurrencyCode}`,
          date: undefined,
          expiration: pairExpiration
        })
      }
    }

    // Fetch rates from server in batches
    const newRates: ExchangeRateCache = {}
    for (let i = 0; i < assetPairs.length; i += RATES_SERVER_MAX_QUERY_SIZE) {
      const query = assetPairs.slice(i, i + RATES_SERVER_MAX_QUERY_SIZE)

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: query })
      }

      try {
        const response = await fetchRates('v2/exchangeRates', options)
        if (response.ok) {
          const json = await response.json()
          const cleanedRates = asRatesResponse(json)
          for (const rate of cleanedRates.data) {
            const { currency_pair: currencyPair, exchangeRate, date } = rate
            const isHistorical = now - new Date(date).valueOf() > HOUR_MS
            const key = isHistorical ? `${currencyPair}_${date}` : currencyPair

            if (exchangeRate != null) {
              newRates[key] = {
                expiration: rateExpiration,
                rate: parseFloat(exchangeRate)
              }
            }
          }
        }
      } catch (error: unknown) {
        console.log(
          `fetchExchangeRatesForFiat error querying rates server ${String(
            error
          )}`
        )
      }
    }

    // Merge with existing rates
    const mergedRates = { ...exchangeRateCache?.rates, ...newRates }
    const { exchangeRates, exchangeRatesMap } = buildGuiRates(
      mergedRates,
      yesterday
    )

    // Update Redux state
    dispatch({
      type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
      data: {
        exchangeRates,
        exchangeRatesMap
      }
    })

    // Update the in-memory cache if it exists
    if (exchangeRateCache != null) {
      exchangeRateCache.rates = mergedRates
    }
  }
}
