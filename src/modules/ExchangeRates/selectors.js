// @flow

import type {State} from '../ReduxTypes'

export const getExchangeRates = (state: State) => {
  return state.exchangeRates
}
