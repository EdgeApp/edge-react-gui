import { div, eq } from 'biggystring'
import { asArray, asEither, asNull, asNumber, asObject, asOptional, asString } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'

import { RootState, ThunkAction } from '../types/reduxTypes'
import { GuiExchangeRates } from '../types/types'
import { fetchRates } from '../util/network'
import { datelog, DECIMAL_PRECISION } from '../util/utils'

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
    rate: asString
  })
)
const asExchangeRateCacheFile = asObject({
  rates: asExchangeRateCache,
  assetPairs: asArray(asAssetPair)
})

type AssetPair = ReturnType<typeof asAssetPair>
type ExchangeRateCache = ReturnType<typeof asExchangeRateCache>
type ExchangeRateCacheFile = ReturnType<typeof asExchangeRateCacheFile>

let exchangeRateCache: ExchangeRateCache = {}

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
    const exchangeRates = await buildExchangeRates(state)
    dispatch({
      type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
      data: { exchangeRates }
    })
  }
}

async function buildExchangeRates(state: RootState): Promise<GuiExchangeRates> {
  const accountIsoFiat = state.ui.settings.defaultIsoFiat
  const { account } = state.core
  const { currencyWallets } = account

  // Look up various dates:
  const now = Date.now()
  const pairExpiration = now + ONE_MONTH
  const rateExpiration = now + ONE_DAY
  const yesterday = getYesterdayDateRoundDownHour(now).toISOString()

  // What we need to fetch from the server:
  const initialAssetPairs: AssetPair[] = []
  let hasWallets = false
  let hasCachedRates = false

  // If we have loaded the cache before, keep any un-expired entries:
  const rateCache: ExchangeRateCache = {}
  const cachedKeys = Object.keys(exchangeRateCache)
  if (cachedKeys.length > 0) {
    for (const key of cachedKeys) {
      if (exchangeRateCache[key].expiration > now) {
        rateCache[key] = exchangeRateCache[key]
        hasCachedRates = true
      }
    }
  } else {
    // Load exchange rate cache off disk, since we haven't done that yet:
    try {
      const raw = await disklet.getText(EXCHANGE_RATES_FILENAME)
      const json = JSON.parse(raw)
      const { assetPairs, rates } = asExchangeRateCacheFile(json)

      // Keep un-expired rates:
      for (const key of Object.keys(rates)) {
        if (rates[key].expiration > now) {
          rateCache[key] = rates[key]
          hasCachedRates = true
        }
      }

      // Keep un-expired asset pairs:
      for (const pair of assetPairs) {
        if (pair.expiration > now) {
          initialAssetPairs.push(pair)
        }
      }
    } catch (e) {
      datelog('Error loading exchange rate cache:', String(e))
    }
  }

  // If the user's fiat isn't dollars, get it's price:
  if (accountIsoFiat !== 'iso:USD') {
    initialAssetPairs.push({
      currency_pair: `iso:USD_${accountIsoFiat}`,
      date: undefined,
      expiration: pairExpiration
    })
  }

  for (const walletId of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[walletId]
    const { currencyCode } = wallet.currencyInfo
    hasWallets = true

    // Get the primary asset's prices for today and yesterday,
    // but with yesterday's price in dollars:
    initialAssetPairs.push({
      currency_pair: `${currencyCode}_${accountIsoFiat}`,
      date: undefined,
      expiration: pairExpiration
    })
    initialAssetPairs.push({
      currency_pair: `${currencyCode}_iso:USD`,
      date: yesterday,
      expiration: pairExpiration
    })

    // Do the same for any tokens:
    for (const tokenId of wallet.enabledTokenIds) {
      const token = wallet.currencyConfig.allTokens[tokenId]
      if (token == null) continue
      if (token.currencyCode === currencyCode) continue
      initialAssetPairs.push({
        currency_pair: `${token.currencyCode}_${accountIsoFiat}`,
        date: undefined,
        expiration: pairExpiration
      })
      initialAssetPairs.push({
        currency_pair: `${token.currencyCode}_iso:USD`,
        date: yesterday,
        expiration: pairExpiration
      })
    }
  }

  // De-duplicate asset pairs:
  const assetMap = new Map<string, AssetPair>()
  for (const asset of initialAssetPairs) {
    const key = `${asset.currency_pair}_${asset.date ?? ''}`

    const existing = assetMap.get(key)
    if (existing == null || asset.expiration > existing.expiration) {
      assetMap.set(key, asset)
    }
  }
  const filteredAssetPairs = [...assetMap.values()]

  /**
   * On initial load, buildExchangeRates may get called before any wallets are
   * loaded. In this case, we can skip the rates fetch and use the cache to
   * save on the network delay.
   */
  const skipRatesFetch = hasCachedRates && !hasWallets

  while (filteredAssetPairs.length > 0) {
    if (skipRatesFetch) break
    const query = filteredAssetPairs.splice(0, RATES_SERVER_MAX_QUERY_SIZE)
    let tries = 5
    do {
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
              rateCache[key] = {
                expiration: rateExpiration,
                rate: exchangeRate
              }
            } else if (rateCache[key] == null) {
              // We at least need a placeholder:
              rateCache[key] = {
                expiration: 0,
                rate: '0'
              }
            }
          }
          break
        }
      } catch (e: any) {
        console.log(`buildExchangeRates error querying rates server ${e.message}`)
      }
    } while (--tries > 0)
  }

  // Save exchange rate cache to disk:
  try {
    const exchangeRateCacheFile: ExchangeRateCacheFile = {
      rates: rateCache,
      assetPairs: filteredAssetPairs
    }
    await disklet.setText(EXCHANGE_RATES_FILENAME, JSON.stringify(exchangeRateCacheFile))
  } catch (e) {
    datelog('Error saving exchange rate cache:', String(e))
  }
  exchangeRateCache = rateCache

  // Build the GUI rate structure:
  const serverRates: GuiExchangeRates = { 'iso:USD_iso:USD': '1' }
  for (const key of Object.keys(rateCache)) {
    const { rate } = rateCache[key]
    serverRates[key] = rate

    // Include reverse rates:
    const codes = key.split('_')
    const reverseKey = `${codes[1]}_${codes[0]}${codes[2] ? '_' + codes[2] : ''}`
    serverRates[reverseKey] = eq(rate, '0') ? '0' : div('1', rate, DECIMAL_PRECISION)
  }
  return serverRates
}

const getYesterdayDateRoundDownHour = (now?: Date | number): Date => {
  const yesterday = now == null ? new Date() : new Date(now)
  yesterday.setMinutes(0)
  yesterday.setSeconds(0)
  yesterday.setMilliseconds(0)
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday
}
