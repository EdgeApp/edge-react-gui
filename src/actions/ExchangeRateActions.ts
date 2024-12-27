import { div, eq } from 'biggystring'
import { asArray, asEither, asNull, asNumber, asObject, asOptional, asString } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'

import { RootState, ThunkAction } from '../types/reduxTypes'
import { GuiExchangeRates } from '../types/types'
import { fetchRates } from '../util/network'
import { datelog, DECIMAL_PRECISION, getYesterdayDateRoundDownHour } from '../util/utils'

const disklet = makeReactNativeDisklet()
const EXCHANGE_RATES_FILENAME = 'exchangeRates.json'
const RATES_SERVER_MAX_QUERY_SIZE = 100
const HOUR_MS = 1000 * 60 * 60
const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_MONTH = 1000 * 60 * 60 * 24 * 30

const asAssetPair = asObject({ currency_pair: asString, date: asOptional(asString), expiration: asNumber })
const asExchangeRateCache = asObject(asObject({ expiration: asNumber, rate: asString }))
const asExchangeRateCacheFile = asObject({
  rates: asExchangeRateCache,
  assetPairs: asArray(asAssetPair)
})

type AssetPair = ReturnType<typeof asAssetPair>
type ExchangeRateCache = ReturnType<typeof asExchangeRateCache>
type ExchangeRateCacheFile = ReturnType<typeof asExchangeRateCacheFile>

const exchangeRateCache: ExchangeRateCache = {}

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

/**
 * Remove duplicates and expired entries from the given array of AssetPair.
 * If two items share the same currency_pair and date,
 * only keep the one with the higher expiration.
 */
function filterAssetPairs(assetPairs: AssetPair[]): AssetPair[] {
  const map = new Map<string, AssetPair>()
  const now = Date.now()
  for (const asset of assetPairs) {
    if (asset.expiration < now) continue
    // Construct a key based on currency_pair and date (including handling for empty/undefined date)
    const key = `${asset.currency_pair}_${asset.date ?? ''}`

    const existing = map.get(key)
    if (existing == null || asset.expiration > existing.expiration) {
      map.set(key, asset)
    }
  }

  return [...map.values()]
}

async function buildExchangeRates(state: RootState): Promise<GuiExchangeRates> {
  const { account } = state.core
  const { currencyWallets } = account
  const now = Date.now()
  const exchangeRates: AssetPair[] = []

  // Load exchange rate cache off disk
  try {
    const raw = await disklet.getText(EXCHANGE_RATES_FILENAME)
    const json = JSON.parse(raw)
    const exchangeRateCacheFile = asExchangeRateCacheFile(json)
    const { assetPairs, rates } = exchangeRateCacheFile
    // Prune expired rates
    for (const key of Object.keys(rates)) {
      if (rates[key].expiration > now) {
        exchangeRateCache[key] = rates[key]
      }
    }
    for (const pair of assetPairs) {
      if (pair.expiration > now) {
        exchangeRates.push(pair)
      }
    }
  } catch (e) {
    datelog('Error loading exchange rate cache:', String(e))
  }

  const accountIsoFiat = state.ui.settings.defaultIsoFiat

  const expiration = now + ONE_MONTH
  const yesterdayDate = getYesterdayDateRoundDownHour()
  if (accountIsoFiat !== 'iso:USD') {
    exchangeRates.push({ currency_pair: `iso:USD_${accountIsoFiat}`, date: undefined, expiration })
  }
  for (const id of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[id]
    const currencyCode = wallet.currencyInfo.currencyCode
    // need to get both forward and backwards exchange rates for wallets & account fiats, for each parent currency AND each token
    exchangeRates.push({ currency_pair: `${currencyCode}_${accountIsoFiat}`, date: undefined, expiration })
    exchangeRates.push({ currency_pair: `${currencyCode}_iso:USD`, date: `${yesterdayDate}`, expiration })
    // now add tokens, if they exist
    if (accountIsoFiat !== 'iso:USD') {
      exchangeRates.push({ currency_pair: `iso:USD_${accountIsoFiat}`, date: undefined, expiration })
    }
    for (const tokenId of wallet.enabledTokenIds) {
      if (wallet.currencyConfig.allTokens[tokenId] == null) continue
      const { currencyCode: tokenCode } = wallet.currencyConfig.allTokens[tokenId]
      if (tokenCode !== currencyCode) {
        exchangeRates.push({ currency_pair: `${tokenCode}_${accountIsoFiat}`, date: undefined, expiration })
        exchangeRates.push({ currency_pair: `${tokenCode}_iso:USD`, date: `${yesterdayDate}`, expiration })
      }
    }
  }

  const filteredExchangeRates = filterAssetPairs(exchangeRates)
  const assetPairs = [...filteredExchangeRates]

  while (filteredExchangeRates.length > 0) {
    const query = filteredExchangeRates.splice(0, RATES_SERVER_MAX_QUERY_SIZE)
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
            const newDate = new Date(date).valueOf()

            const key = now - newDate > HOUR_MS ? `${currencyPair}_${date}` : currencyPair
            const cachedRate = exchangeRateCache[key] ?? { expiration: 0, rate: '0' }
            if (exchangeRate != null) {
              cachedRate.rate = exchangeRate
              cachedRate.expiration = now + ONE_DAY
            }
            exchangeRateCache[key] = cachedRate

            const codes = key.split('_')
            const reverseExchangeRateKey = `${codes[1]}_${codes[0]}${codes[2] ? '_' + codes[2] : ''}`
            if (exchangeRateCache[reverseExchangeRateKey] == null) {
              exchangeRateCache[reverseExchangeRateKey] = { expiration: cachedRate.expiration, rate: '0' }
              if (!eq(cachedRate.rate, '0')) {
                exchangeRateCache[reverseExchangeRateKey].rate = div('1', cachedRate.rate, DECIMAL_PRECISION)
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

  // Save exchange rate cache to disk
  try {
    const exchangeRateCacheFile: ExchangeRateCacheFile = { rates: exchangeRateCache, assetPairs }
    await disklet.setText(EXCHANGE_RATES_FILENAME, JSON.stringify(exchangeRateCacheFile))
  } catch (e) {
    datelog('Error saving exchange rate cache:', String(e))
  }

  const serverRates: GuiExchangeRates = { 'iso:USD_iso:USD': '1' }
  for (const key of Object.keys(exchangeRateCache)) {
    const rate = exchangeRateCache[key]
    if (rate.expiration > now) {
      serverRates[key] = rate.rate
    } else {
      delete exchangeRateCache[key]
    }
  }

  return serverRates
}
