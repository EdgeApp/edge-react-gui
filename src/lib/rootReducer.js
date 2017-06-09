import { combineReducers } from 'redux'
import routes from './routesReducer'
import { core } from '../modules/Core/reducer.js'
import { ui } from '../modules/UI/reducer.js'

const store = combineReducers({
  routes,
  core,
  ui
})

export default store
