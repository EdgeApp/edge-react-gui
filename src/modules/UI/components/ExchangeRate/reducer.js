// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../../ReduxTypes.js'

export type ExchangeRateState = {
  exchangeRates: {}
}

const exchangeRates = (state = {}, action: Action): {} => {
  switch (action.type) {
    case 'UPDATE_EXCHANGE_RATES':
      if (action.data == null) throw new TypeError('Invalid action')
      return action.data
    default:
      return state
  }
}

export const exchangeRate: Reducer<ExchangeRateState, Action> = combineReducers({
  exchangeRates
})
