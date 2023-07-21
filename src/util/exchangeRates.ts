import { asArray, asEither, asNull, asObject, asString } from 'cleaners'
import { EdgeFetchFunction } from 'edge-core-js'

import { fetchRates } from './network'

const RATES_SERVER_MAX_QUERY_SIZE = 100
const FETCH_FREQUENCY = 1000
const SHOW_LOGS = false

const clog = SHOW_LOGS ? console.log : (...args: any) => undefined
const asRatesResponse = asObject({
  data: asArray(
    asObject({
      currency_pair: asString,
      date: asString,
      exchangeRate: asEither(asString, asNull)
    })
  )
})

interface RateMap {
  [pair_date: string]: number | null
}

interface RateQueueEntry {
  currency_pair: string
  date: string
}

const rateMap: RateMap = {}
const resolverMap: {
  [pair_date: string]: {
    resolvers: Function[]
    rateQueueEntry: RateQueueEntry
  }
} = {}
let inQuery = false

const makePairDate = (currencyPair: string, date: string) => `${currencyPair}_${date}`

export const roundHalfMinute = (dateStr: string) => {
  const date = new Date(dateStr)
  let seconds = date.getSeconds()
  seconds = seconds > 30 ? 30 : 0

  date.setMinutes(0)
  date.setSeconds(seconds)
  date.setMilliseconds(0)
  return date.toISOString()
}

let numDoQuery = 0
const doQuery = async (doFetch?: EdgeFetchFunction): Promise<void> => {
  const n = numDoQuery++
  clog(`${n} doQuery enter`)

  const data: RateQueueEntry[] = []

  // Fill the query up to RATES_SERVER_MAX_QUERY_SIZE entries
  const values = Object.values(resolverMap)
  for (const value of values) {
    data.push(value.rateQueueEntry)
    if (data.length === RATES_SERVER_MAX_QUERY_SIZE) break
  }

  clog(`${n} fetching ${JSON.stringify(data, null, 2)}`)
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  }
  try {
    const response = await fetchRates('v2/exchangeRates', options, 5000, doFetch)
    if (response.ok) {
      const json = await response.json()
      const cleanedRates = asRatesResponse(json)
      for (const rateObj of cleanedRates.data) {
        const { currency_pair: currencyPair, date } = rateObj
        let { exchangeRate } = rateObj
        if (exchangeRate == null) {
          console.log(`${n} doQuery: ${currencyPair} ${date} exchangeRate=null`)
          exchangeRate = '0'
        }
        const rate = parseFloat(exchangeRate)
        const pairDate = makePairDate(currencyPair, date)
        rateMap[pairDate] = rate
        if (resolverMap[pairDate] == null) {
          clog(`${n} oops`)
          continue
        }
        const { resolvers } = resolverMap[pairDate]
        clog(`${n} deleting ${pairDate}`)
        delete resolverMap[pairDate]
        if (resolvers.length) {
          resolvers.forEach((r, i) => {
            r(rate)
          })
        }
      }
    } else {
      const text = await response.text()
      throw new Error(text)
    }
  } catch (e: any) {
    console.warn(`Error querying rates server ${e.message}`)
    // Resolve all the promises with value 0
    Object.entries(resolverMap).forEach(entry => {
      const [pairDate, value] = entry
      clog(`${n} throw deleting ${pairDate}`)
      delete resolverMap[pairDate]
      value.resolvers.forEach(resolve => resolve(0))
    })
  }
  if (Object.keys(resolverMap).length > 0) {
    clog(`${n} Calling doQuery again`)
    await doQuery(doFetch)
  } else {
    clog(`${n} doQuery complete`)
    inQuery = false
  }
}

const addToQueue = (entry: RateQueueEntry, resolve: Function, maxQuerySize: number, doFetch?: EdgeFetchFunction) => {
  const { currency_pair: pair, date } = entry
  const pairDate = makePairDate(pair, date)

  if (resolverMap[pairDate] == null) {
    // Create a new entry in the map for this pair/date
    clog(`adding ${pairDate}`)
    resolverMap[pairDate] = {
      resolvers: [resolve],
      rateQueueEntry: entry
    }
  } else {
    // Add a resolver to existing pair/date entry
    resolverMap[pairDate].resolvers.push(resolve)
    return
  }
  if (!inQuery) {
    inQuery = true
    setTimeout(async () => await doQuery(doFetch), FETCH_FREQUENCY)
  }
}

export const getHistoricalRate = async (
  codePair: string,
  date: string,
  maxQuerySize: number = RATES_SERVER_MAX_QUERY_SIZE,
  doFetch?: EdgeFetchFunction
): Promise<number> => {
  const roundDate = roundHalfMinute(date)
  return await new Promise((resolve, reject) => {
    const [code1, code2] = codePair.split('_').sort()
    const pair = `${code1}_${code2}`
    const reverse = pair !== codePair
    const rate = rateMap[makePairDate(pair, roundDate)]
    if (rate == null) {
      addToQueue({ currency_pair: pair, date: roundDate }, resolve, maxQuerySize, doFetch)
      return
    }

    let out = rate
    if (reverse && rate !== 0) {
      out = 1 / rate
    }
    resolve(out)
  })
}
