import { combineReducers } from 'redux'
import routes from './routesReducer'
import { core } from '../modules/Core/reducer.js'
import { ui } from '../modules/UI/reducer.js'
import { exchangeRates } from '../modules/ExchangeRates/reducer.js'

const store = combineReducers({
  routes,
  core,
  ui,
  exchangeRates
})

export default store
