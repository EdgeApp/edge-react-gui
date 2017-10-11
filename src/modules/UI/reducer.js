// @flow
import type {State} from '../reduxTypes'

import {combineReducers} from 'redux'

import {scenes} from './scenes/reducer.js'
import {wallets} from './Wallets/reducer.js'
import {request} from './Request/reducer.js'
import {settings} from './Settings/reducer.js'
import locale from './locale/reducer'
import contacts from './contacts/reducer'
import dropdownAlert from './components/DropdownAlert/reducer'

const uiReducer = combineReducers({
  dropdownAlert,
  scenes,
  wallets,
  request,
  settings,
  locale,
  contacts
})

export const ui = (state: $PropertyType<State, 'ui'>, action: any) => {
  if (action.type === 'LOGOUT') {
    return uiReducer(undefined, ({type: 'DUMMY_ACTION_PLEASE_IGNORE'}: any))
  }

  return uiReducer(state, action)
}
