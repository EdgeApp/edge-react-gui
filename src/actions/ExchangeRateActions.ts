import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import type { EdgeAccount } from 'edge-core-js'

import type { ThunkAction } from '../types/reduxTypes'
import {
  asCryptoAsset,
  asRatesParams,
  type RatesParams
} from '../util/exchangeRates'
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

export function updateExchangeRates(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { defaultIsoFiat } = state.ui.settings
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
      yesterday
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
  for (const pair of cryptoPairs) {
    if (pair.expiration < now) continue
    out.cryptoPairs.push(pair)
  }
  for (const pair of fiatPairs) {
    if (pair.expiration < now) continue
    out.fiatPairs.push(pair)
  }

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
  for (const query of requests) {
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
        const targetFiat = fixFiatCurrencyCode(cleanedRates.targetFiat)

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
        break
      }
    } catch (error: unknown) {
      console.log(
        `buildExchangeRates error querying rates server ${String(error)}`
      )
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

const getYesterdayDateRoundDownHour = (now?: Date | number): Date => {
  const yesterday = now == null ? new Date() : new Date(now)
  yesterday.setMinutes(0)
  yesterday.setSeconds(0)
  yesterday.setMilliseconds(0)
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday
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
        targetFiat: removeIsoPrefix(targetFiat),
        crypto: cryptoChunk.map(pair => ({
          isoDate: pair.isoDate == null ? newDate : new Date(pair.isoDate),
          asset: pair.asset,
          rate: undefined
        })),
        fiat: fiatChunk.map(pair => ({
          isoDate: pair.isoDate == null ? newDate : new Date(pair.isoDate),
          fiatCode: removeIsoPrefix(pair.fiatCode),
          rate: undefined
        }))
      })
    }
  }

  return requests
}
