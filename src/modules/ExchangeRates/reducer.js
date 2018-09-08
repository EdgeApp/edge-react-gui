// @flow

import type { Action } from '../ReduxTypes.js'
const intialState = {}

type ExchangeRateState = Object
const exchangeRatesReducer = (state = intialState, action) => {
  switch (action.type) {
    case 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES':
      return action.data.exchangeRates
    default:
      return state
  }
}

export const exchangeRates = (state: ExchangeRateState, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'DEEP_LINK_RECEIVED') {
    state = undefined
  }

  return exchangeRatesReducer(state, action)
}
