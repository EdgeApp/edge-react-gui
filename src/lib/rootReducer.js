// @flow

import { combineReducers } from 'redux'

import { core } from '../modules/Core/reducer.js'
import { ui } from '../modules/UI/reducer.js'
import { exchangeRates } from '../modules/ExchangeRates/reducer.js'
import cryptoExchange from '../reducers/CryptoExchangeReducer'

export const rootReducer = combineReducers({
  core,
  ui,
  cryptoExchange,
  exchangeRates
})

export default rootReducer
