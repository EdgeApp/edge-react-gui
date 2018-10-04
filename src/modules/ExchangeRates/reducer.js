// @flow

import { type Reducer } from 'redux'

import type { Action } from '../ReduxTypes.js'

export type ExchangeRatesState = {
  [string]: number
}

const initialState = {}

export const exchangeRates: Reducer<ExchangeRatesState, Action> = (state = initialState, action: Action) => {
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
