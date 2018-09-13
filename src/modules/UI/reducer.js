// @flow

import { combineReducers } from 'redux'

import { passwordReminderReducer as passwordReminder } from '../../reducers/passwordReminder/indexPasswordReminder.js'
import type { State } from '../ReduxTypes'
import errorAlert from './components/ErrorAlert/reducer'
import transactionAlert from './components/TransactionAlert/reducer'
import { request } from './Request/reducer.js'
import { scenes } from './scenes/reducer.js'
import { settings } from './Settings/reducer.js'
import { wallets } from './Wallets/reducer.js'

export { errorAlert, transactionAlert, passwordReminder, scenes, wallets, request, settings }

export const uiReducer = combineReducers({
  errorAlert,
  transactionAlert,
  passwordReminder,
  scenes,
  wallets,
  request,
  settings
})

export const ui = (state: $PropertyType<State, 'ui'>, action: any) => {
  if (action.type === 'LOGOUT' || action.type === 'deepLinkReceived') {
    return uiReducer(undefined, ({ type: 'DUMMY_ACTION_PLEASE_IGNORE' }: any))
  }

  // $FlowFixMe
  return uiReducer(state, action)
}
