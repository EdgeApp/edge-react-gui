// @flow

import { combineReducers } from 'redux'

import * as ACTION from './action.js'

const exchangeRates = (state = {}, action) => {
  switch (action.type) {
    case ACTION.UPDATE_EXCHANGE_RATES:
      return action.data
    default:
      return state
  }
}

export const exchangeRate = combineReducers({
  exchangeRates
})

export default exchangeRate
