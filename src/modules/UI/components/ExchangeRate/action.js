// @flow

export const UPDATE_EXCHANGE_RATES = 'UPDATE_EXCHANGE_RATES'

const randomSeed = Math.random() / 10 // produces random number between 0 and 1

const fakeExchangeRate = {
  BTC: {
    value: (1 / 214800000000) * randomSeed
  },
  BCH: {
    value: (1 / 214800000000) * randomSeed
  },
  ETH: {
    value: (1 / 231000000000000000000) * randomSeed
  },
  TRD: {
    value: 2 * randomSeed
  },
  DOGESHIT: {
    value: 0.3 * randomSeed
  },
  HOLYSHIT: {
    value: 0.2 * randomSeed
  },
  ANA: {
    value: 0.1 * randomSeed
  },
  REP: {
    value: (1 / 18000000000000000000) * randomSeed
  },
  WINGS: {
    value: (1 / 5000000000000000000) * randomSeed
  },
  LUN: {
    value: (1 / 2000000000000000000) * randomSeed
  }
}

export const updateExchangeRates = () => ({
  type: UPDATE_EXCHANGE_RATES,
  data: fakeExchangeRate
})
