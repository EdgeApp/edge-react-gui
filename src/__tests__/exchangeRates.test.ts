import { beforeAll, expect, it, jest } from '@jest/globals'
import fetch from 'node-fetch'

import { getHistoricalCryptoRate } from '../util/exchangeRates'
import { mswServer } from '../util/mswServer'
import { snooze } from '../util/utils'

// Uncomment for testing under Node w/o Jest
// const { getHistoricalRate } = require('../util/exchangeRates')
// const expect = (arg: any) => ({
//   toEqual: (arg: any) => undefined
// })

beforeAll(() => {
  jest.useRealTimers()
  mswServer.listen()
})
afterAll(() => {
  mswServer.close()
})

const TEST_MAX_QUERY_SIZE = 2

it('get bulk rates', async () => {
  // async function main(): Promise<void> {
  const promises: Array<Promise<unknown>> = []
  promises.push(
    getHistoricalCryptoRate(
      'bitcoin',
      null,
      'iso:USD',
      '2022-06-01T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(29753)
    })
  )

  promises.push(
    getHistoricalCryptoRate(
      'ethereum',
      null,
      'iso:USD',
      '2022-06-02T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(1831)
    })
  )

  promises.push(
    getHistoricalCryptoRate(
      'monero',
      null,
      'iso:EUR',
      '2022-06-03T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(180)
    })
  )

  promises.push(
    getHistoricalCryptoRate(
      'bitcoin',
      null,
      'iso:PHP',
      '2022-06-04T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(1578639)
    })
  )

  promises.push(
    getHistoricalCryptoRate(
      'dogecoin',
      null,
      'iso:MXN',
      '2022-06-04T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(1)
    })
  )

  await snooze(2000)

  promises.push(
    getHistoricalCryptoRate(
      'bitcoin',
      null,
      'iso:PHP',
      '2022-06-04T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(1578639)
    })
  )

  promises.push(
    getHistoricalCryptoRate(
      'dogecoin',
      null,
      'iso:MXN',
      '2022-06-04T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(1)
    })
  )

  await snooze(1000)

  promises.push(
    getHistoricalCryptoRate(
      'ethereum',
      null,
      'iso:USD',
      '2022-06-02T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(1831)
    })
  )

  promises.push(
    getHistoricalCryptoRate(
      'monero',
      null,
      'iso:EUR',
      '2022-06-03T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(180)
    })
  )

  promises.push(
    getHistoricalCryptoRate(
      'bitcoin',
      null,
      'iso:PHP',
      '2022-06-04T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(1578639)
    })
  )

  promises.push(
    getHistoricalCryptoRate(
      'dogecoin',
      null,
      'iso:MXN',
      '2022-06-04T04:00:00.000Z',
      TEST_MAX_QUERY_SIZE,
      fetch
    ).then(v => {
      expect(Math.floor(v)).toEqual(1)
    })
  )

  await Promise.all(promises)
})

// main().catch(e => console.log('error'))
