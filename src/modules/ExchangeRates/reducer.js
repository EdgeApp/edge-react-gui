// @flow

import { type Reducer } from 'redux'

import { type Action } from '../../types/reduxTypes.js'
import { type GuiExchangeRates } from '../../types/types.js'

export type ExchangeRatesState = GuiExchangeRates

const initialState: ExchangeRatesState = {}

export const exchangeRates: Reducer<ExchangeRatesState, Action> = (
  state = initialState,
  action: Action
) => {
  switch (action.type) {
    case 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES':
      return action.data.exchangeRates
    case 'LOGOUT':
      return initialState
    default:
      return state
  }
}
