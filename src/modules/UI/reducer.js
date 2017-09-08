import { combineReducers } from 'redux'

import { scenes } from './scenes/reducer.js'
import { wallets } from './Wallets/reducer.js'
import { request } from './Request/reducer.js'
import { settings } from './Settings/reducer.js'
import locale from './locale/reducer'
import contacts from './contacts/reducer'

const uiReducer = combineReducers({
  scenes,
  wallets,
  request,
  settings,
  locale,
  contacts
})

export const ui = (state, action) => {
  if (action.type === 'LOGOUT') {
    state = undefined
  }

  return uiReducer(state, action)
}
