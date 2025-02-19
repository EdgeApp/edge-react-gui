import { asArray, asEither, asNull, asNumber, asObject, asOptional, asString } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import { EdgeAccount } from 'edge-core-js'

import { ThunkAction } from '../types/reduxTypes'
import { GuiExchangeRates } from '../types/types'
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
type ExchangeRateCache = ReturnType<typeof asExchangeRateCache>
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

    // If this is the first run, immediately use whatever we have on disk
    // before moving on to the potentially slow network:
    if (exchangeRateCache == null) {
      exchangeRateCache = await loadExchangeRateCache().catch(error => {
        datelog('Error loading exchange rate cache:', String(error))
        return { assetPairs: [], rates: {} }
      })
      dispatch({
        type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
        data: {
          exchangeRates: buildGuiRates(exchangeRateCache.rates)
        }
      })
    }

    // Refresh from the network:
    await fetchExchangeRates(account, defaultIsoFiat, exchangeRateCache)
    dispatch({
      type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
      data: {
        exchangeRates: buildGuiRates(exchangeRateCache.rates)
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
async function fetchExchangeRates(account: EdgeAccount, accountIsoFiat: string, cache: ExchangeRateCacheFile): Promise<void> {
  const { currencyWallets } = account

  // Look up various dates:
  const now = Date.now()
  const pairExpiration = now + ONE_MONTH
  const rateExpiration = now + ONE_DAY
  const yesterday = getYesterdayDateRoundDownHour(now).toISOString()

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
        console.log(`buildExchangeRates error querying rates server ${String(error)}`)
      }
    }
  }

  // Update the in-memory cache:
  exchangeRateCache = { rates, assetPairs }

  // Write the cache to disk:
  await disklet.setText(EXCHANGE_RATES_FILENAME, JSON.stringify(exchangeRateCache)).catch(error => {
    datelog('Error saving exchange rate cache:', String(error))
  })
}

/**
 * Converts rates from the cache format to the GUI's in-memory format.
 */
function buildGuiRates(rateCache: ExchangeRateCache): GuiExchangeRates {
  const out: GuiExchangeRates = { 'iso:USD_iso:USD': 1 }
  for (const key of Object.keys(rateCache)) {
    const { rate } = rateCache[key]
    out[key] = rate

    // Include reverse rates:
    const codes = key.split('_')
    const reverseKey = `${codes[1]}_${codes[0]}${codes[2] ? '_' + codes[2] : ''}`
    out[reverseKey] = rate === 0 ? 0 : 1 / rate
  }
  return out
}

const getYesterdayDateRoundDownHour = (now?: Date | number): Date => {
  const yesterday = now == null ? new Date() : new Date(now)
  yesterday.setMinutes(0)
  yesterday.setSeconds(0)
  yesterday.setMilliseconds(0)
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday
}
