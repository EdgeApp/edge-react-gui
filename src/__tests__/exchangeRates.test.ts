import { beforeAll, expect, it, jest } from '@jest/globals'
import fetch from 'node-fetch'

import { closestRateForTimestamp, ExchangeRateCache } from '../actions/ExchangeRateActions'
import { getHistoricalRate } from '../util/exchangeRates'
import { snooze } from '../util/utils'

// Uncomment for testing under Node w/o Jest
// const { getHistoricalRate } = require('../util/exchangeRates')
// const expect = (arg: any) => ({
//   toEqual: (arg: any) => undefined
// })

beforeAll(() => {
  jest.useRealTimers()
})

const TEST_MAX_QUERY_SIZE = 2

it('get bulk rates', async () => {
  // async function main(): Promise<void> {
  const promises: Array<Promise<unknown>> = []
  promises.push(
    getHistoricalRate('BTC_iso:USD', '2022-06-01T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`31616 === ${Math.floor(v)}`)
      expect(31616).toEqual(Math.floor(v))
    })
  )

  promises.push(
    getHistoricalRate('ETH_iso:USD', '2022-06-02T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`1814 === ${Math.floor(v)}`)
      expect(1814).toEqual(Math.floor(v))
    })
  )

  promises.push(
    getHistoricalRate('XMR_iso:EUR', '2022-06-03T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`184 === ${Math.floor(v)}`)
      expect(184).toEqual(Math.floor(v))
    })
  )

  promises.push(
    getHistoricalRate('BTC_iso:PHP', '2022-06-04T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`1553326 === ${Math.floor(v)}`)
      expect(1553326).toEqual(Math.floor(v))
    })
  )

  promises.push(
    getHistoricalRate('DOGE_iso:MXN', '2022-06-04T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`1 === ${Math.floor(v)}`)
      expect(1).toEqual(Math.floor(v))
    })
  )

  await snooze(2000)

  promises.push(
    getHistoricalRate('BTC_iso:PHP', '2022-06-04T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`1553326 === ${Math.floor(v)}`)
      expect(1553326).toEqual(Math.floor(v))
    })
  )

  promises.push(
    getHistoricalRate('DOGE_iso:MXN', '2022-06-04T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`1 === ${Math.floor(v)}`)
      expect(1).toEqual(Math.floor(v))
    })
  )

  await snooze(1000)

  promises.push(
    getHistoricalRate('ETH_iso:USD', '2022-06-02T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`1814 === ${Math.floor(v)}`)
      expect(1814).toEqual(Math.floor(v))
    })
  )

  promises.push(
    getHistoricalRate('XMR_iso:EUR', '2022-06-03T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`184 === ${Math.floor(v)}`)
      expect(184).toEqual(Math.floor(v))
    })
  )

  promises.push(
    getHistoricalRate('BTC_iso:PHP', '2022-06-04T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`1553326 === ${Math.floor(v)}`)
      expect(1553326).toEqual(Math.floor(v))
    })
  )

  promises.push(
    getHistoricalRate('DOGE_iso:MXN', '2022-06-04T04:00:00.000Z', TEST_MAX_QUERY_SIZE, fetch).then(v => {
      console.log(`1 === ${Math.floor(v)}`)
      expect(1).toEqual(Math.floor(v))
    })
  )

  await Promise.all(promises)
})

it('get closest rate for timestamp', () => {
  const targetDate = '2025-03-12T23:00:00.000Z'
  const rateCache: ExchangeRateCache = {
    'ETH_iso:USD_2025-03-13T23:10:00.000Z': { rate: 1879.75664619359304197133, expiration: 12345 },
    'ETH_iso:USD_2025-03-11T22:55:00.000Z': { rate: 1944.99840563707630280987, expiration: 12345 },
    'ETH_iso:USD_2025-03-09T20:00:00.000Z': { rate: 2041.15092554349985221052, expiration: 12345 },
    'ETH_iso:USD_2025-03-04T19:00:00.000Z': { rate: 2160.9592242148933110002, expiration: 12345 }
  }
  const rateETH = closestRateForTimestamp(rateCache, 'ETH', Date.parse(targetDate))
  expect(rateETH).toEqual(1944.99840563707630280987)
  const rateBTC = closestRateForTimestamp(rateCache, 'BTC', Date.parse(targetDate))
  expect(rateBTC).toEqual(undefined)
})

// main().catch(e => console.log('error'))
