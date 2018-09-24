// @flow

import type { Action } from '../ReduxTypes.js'
const initialState = {}

type ExchangeRateState = Object
const exchangeRatesReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES':
      if (!action.data) throw new Error('Invalid action')
      return action.data.exchangeRates
    case 'LOGOUT':
      return initialState
    case 'DEEP_LINK_RECEIVED':
      return initialState
    default:
      return state
  }
}

export const exchangeRates = (state: ExchangeRateState, action: Action) => {
  return exchangeRatesReducer(state, action)
}
