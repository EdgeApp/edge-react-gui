import { combineReducers } from 'redux'

import scenes from './scenes/reducer.js'
import wallets from './Wallets/reducer.js'
import request from './Request/reducer.js'
import settings from './Settings/reducer.js'

export const ui = combineReducers({
  scenes,
  wallets,
  request,
  settings
})
