// @flow

import { combineReducers } from 'redux'

const exchangeRates = (state = {}, action) => {
  switch (action.type) {
    case 'UPDATE_EXCHANGE_RATES':
      return action.data
    default:
      return state
  }
}

export const exchangeRate = combineReducers({
  exchangeRates
})

export default exchangeRate
