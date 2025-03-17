import { beforeAll, expect, it, jest } from '@jest/globals'
import fetch from 'node-fetch'

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

// main().catch(e => console.log('error'))
