import {combineReducers} from 'redux'
import routes from './routesReducer'
import {core} from '../modules/Core/reducer.js'
import {ui} from '../modules/UI/reducer.js'
import {exchangeRates} from '../modules/ExchangeRates/reducer.js'
import cryptoExchange from '../reducers/CryptoExchangeReducer'

const rootReducer = combineReducers({
  routes,
  core,
  ui,
  cryptoExchange,
  exchangeRates
})


export default rootReducer
