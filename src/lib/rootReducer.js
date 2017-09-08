import { combineReducers } from 'redux'
import routes from './routesReducer'
import { core } from '../modules/Core/reducer.js'
import { ui } from '../modules/UI/reducer.js'
import { exchangeRates } from '../modules/ExchangeRates/reducer.js'

const appReducer = combineReducers({
  routes,
  core,
  ui,
  exchangeRates
})

export const rootReducer = (state, action) => {
  if (action.type === 'LOGOUT') {
    state = { routes: state.routes }
  }

  return appReducer(state, action)
}

export default rootReducer
