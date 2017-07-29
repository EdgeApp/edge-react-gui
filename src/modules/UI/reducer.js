import { combineReducers } from 'redux'

import { scenes } from './scenes/reducer.js'
import { wallets } from './Wallets/reducer.js'
import { request } from './Request/reducer.js'
import { settings } from './Settings/reducer.js'
import locale from './locale/reducer'
import contacts from './contacts/reducer'

export const ui = combineReducers({
  scenes,
  wallets,
  request,
  settings,
  locale,
  contacts
})
