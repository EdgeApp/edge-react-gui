import {combineReducers} from 'redux'
import routes from './routesReducer'
import {core} from '../modules/Core/reducer.js'
import {ui} from '../modules/UI/reducer.js'
import {exchangeRates} from '../modules/ExchangeRates/reducer.js'
import cryptoExhange from '../reducers/CryptoExchangeReducer'

const rootReducer = combineReducers({
  routes,
  core,
  ui,
  cryptoExhange,
  exchangeRates
})


export default rootReducer
