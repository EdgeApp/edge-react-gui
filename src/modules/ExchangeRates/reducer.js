// @flow

import type { Action } from '../ReduxTypes'

const initialState = 0

type ExchangeRateState = ?number
const exchangeRatesReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ExchangeRates/UPDATE_EXCHANGE_RATES': {
      return state + 1
    }

    default:
      return state
  }
}

export const exchangeRates = (state: ExchangeRateState, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'deepLinkReceived') {
    state = undefined
  }

  return exchangeRatesReducer(state, action)
}
