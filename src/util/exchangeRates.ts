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

import { showError } from '../components/services/AirshipInstance'
import { fetchRates } from './network'
import { removeIsoPrefix } from './utils'

const RATES_SERVER_MAX_QUERY_SIZE = 100
const FETCH_FREQUENCY = 1000
const SHOW_LOGS = false

const clog = SHOW_LOGS ? console.log : (...args: any) => undefined

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

type RateMap = Record<string, number | null>

const rateMap: RateMap = {}
const resolverMap: Record<
  string,
  {
    resolvers: Function[]
    rateQueueEntry: RatesParams
  }
> = {}
let inQuery = false

let numDoQuery = 0
const doQuery = async (doFetch?: EdgeFetchFunction): Promise<void> => {
  const n = numDoQuery++
  clog(`${n} doQuery enter`)

  const groupedParams = new Map<string, RatesParams>()

  // Fill the query up to RATES_SERVER_MAX_QUERY_SIZE entries
  const values = Object.values(resolverMap)
  for (const value of values) {
    const map = groupedParams.get(value.rateQueueEntry.targetFiat)
    if (map == null) {
      groupedParams.set(value.rateQueueEntry.targetFiat, value.rateQueueEntry)
    } else {
      const combinedMap: RatesParams = {
        targetFiat: map.targetFiat,
        crypto: [...map.crypto, ...value.rateQueueEntry.crypto],
        fiat: [...map.fiat, ...value.rateQueueEntry.fiat]
      }
      groupedParams.set(value.rateQueueEntry.targetFiat, combinedMap)
    }

    if (map?.crypto.length === RATES_SERVER_MAX_QUERY_SIZE) break
  }

  for (const data of groupedParams.values()) {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
    try {
      const response = await fetchRates('v3/rates', options, 5000, doFetch)
      if (response.ok) {
        const json = await response.json()
        const cleanedRates = asRatesParams(json)

        // Since the requests are USD only, we'll match up the original requests to what we've received
        for (const [key, { rateQueueEntry, resolvers }] of Object.entries(
          resolverMap
        )) {
          // Match crypto/fiat requests
          if (rateQueueEntry.crypto.length === 1) {
            const cryptoToMatch = rateQueueEntry.crypto[0]
            const fiatToMatch = rateQueueEntry.fiat[0]
            const crypto = cleanedRates.crypto.find(cr => {
              return (
                cr.isoDate?.getTime() === cryptoToMatch.isoDate?.getTime() &&
                cr.asset.pluginId === cryptoToMatch.asset.pluginId &&
                (cr.asset.tokenId === cryptoToMatch.asset.tokenId ||
                  (cr.asset.tokenId == null &&
                    cryptoToMatch.asset.tokenId == null))
              )
            })

            const fiat = cleanedRates.fiat.find(fr => {
              return (
                fr.isoDate?.getTime() === fiatToMatch.isoDate?.getTime() &&
                fr.fiatCode === fiatToMatch.fiatCode
              )
            })

            if (crypto?.rate != null && fiat?.rate != null) {
              const rate = crypto.rate / fiat.rate
              rateMap[key] = rate
              if (resolverMap[key] == null) {
                clog(`${n} oops`)
                continue
              }

              clog(`${n} deleting ${key}`)
              delete resolverMap[key]
              if (resolvers.length) {
                resolvers.forEach((r, i) => {
                  r(rate)
                })
              }
            }
          }

          // Match fiat/fiat requests
          if (rateQueueEntry.fiat.length === 2) {
            const fromFiatToMatch = rateQueueEntry.fiat[0]
            const fiatToMatch = rateQueueEntry.fiat[1]
            const fromFiat = cleanedRates.fiat.find(fr => {
              return (
                fr.isoDate?.getTime() === fromFiatToMatch.isoDate?.getTime() &&
                fr.fiatCode === fromFiatToMatch.fiatCode
              )
            })

            const toFiat = cleanedRates.fiat.find(fr => {
              return (
                fr.isoDate?.getTime() === fiatToMatch.isoDate?.getTime() &&
                fr.fiatCode === fiatToMatch.fiatCode
              )
            })

            if (fromFiat?.rate != null && toFiat?.rate != null) {
              const rate = fromFiat.rate / toFiat.rate
              rateMap[key] = rate
              if (resolverMap[key] == null) {
                clog(`${n} oops`)
                continue
              }

              clog(`${n} deleting ${key}`)
              delete resolverMap[key]
              if (resolvers.length) {
                resolvers.forEach((r, i) => {
                  r(rate)
                })
              }
            }
          }
        }
      } else {
        const text = await response.text()
        throw new Error(text)
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.warn(`Error querying rates server ${e.message}`)
      }
      // Resolve all the promises with value 0
      Object.entries(resolverMap).forEach(entry => {
        const [pairDate, value] = entry
        clog(`${n} throw deleting ${pairDate}`)
        delete resolverMap[pairDate]
        value.resolvers.forEach(resolve => resolve(0))
      })
    }
  }

  if (Object.keys(resolverMap).length > 0) {
    clog(`${n} Calling doQuery again`)
    await doQuery(doFetch)
  } else {
    clog(`${n} doQuery complete`)
    inQuery = false
  }
}

const addToQueue = (
  entry: RatesParams,
  rateKey: string,
  resolve: Function,
  maxQuerySize: number,
  doFetch?: EdgeFetchFunction
) => {
  if (resolverMap[rateKey] == null) {
    // Create a new entry in the map for this pair/date
    clog(`adding ${rateKey}`)
    resolverMap[rateKey] = {
      resolvers: [resolve],
      rateQueueEntry: entry
    }
  } else {
    // Add a resolver to existing pair/date entry
    resolverMap[rateKey].resolvers.push(resolve)
    return
  }
  if (!inQuery) {
    inQuery = true
    setTimeout(() => {
      doQuery(doFetch).catch((error: unknown) => {
        showError(error)
      })
    }, FETCH_FREQUENCY)
  }
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
    const rate = rateMap[rateKey]
    if (rate == null) {
      addToQueue(RatesParams, rateKey, resolve, maxQuerySize, doFetch)
      return
    }

    resolve(rate)
  })
}
