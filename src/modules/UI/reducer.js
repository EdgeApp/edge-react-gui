// @flow

import { type Reducer, combineReducers } from 'redux'

import { type PasswordReminderState, passwordReminder } from '../../reducers/passwordReminder/passwordReminderReducer.js'
import { type Action } from '../ReduxTypes.js'
import { type ErrorAlertState, errorAlert } from './components/ErrorAlert/reducer.js'
import { type TransactionAlertState, transactionAlert } from './components/TransactionAlert/reducer.js'
import { type RequestState, request } from './Request/reducer.js'
import { type ScenesState, scenes } from './scenes/reducer.js'
import { type SettingsState, settings } from './Settings/reducer.js'
import { type WalletsState, wallets } from './Wallets/reducer.js'

export { errorAlert, transactionAlert, passwordReminder, scenes, wallets, request, settings }

export type UiState = {
  +errorAlert: ErrorAlertState,
  +passwordReminder: PasswordReminderState,
  +request: RequestState,
  +scenes: ScenesState,
  +settings: SettingsState,
  +transactionAlert: TransactionAlertState,
  +wallets: WalletsState
}

const uiInner: Reducer<UiState, Action> = combineReducers({
  errorAlert,
  passwordReminder,
  request,
  scenes,
  settings,
  transactionAlert,
  wallets
})

export const ui: Reducer<UiState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'DEEP_LINK_RECEIVED') {
    return uiInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }

  return uiInner(state, action)
}
