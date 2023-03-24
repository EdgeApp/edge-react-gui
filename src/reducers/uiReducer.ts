import { combineReducers, Reducer } from 'redux'

import { ExchangeInfo } from '../actions/ExchangeInfoActions'
import { Action } from '../types/reduxTypes'
import { exchangeInfo } from './ExchangeInfoReducer'
import { fio, FioState } from './FioReducer'
import { passwordReminder, PasswordReminderState } from './PasswordReminderReducer'
import { scenes, ScenesState } from './scenes/ScenesReducer'
import { settings, SettingsState } from './scenes/SettingsReducer'
import { wallets, WalletsState } from './scenes/WalletsReducer'

export interface UiState {
  readonly exchangeInfo: ExchangeInfo
  readonly fio: FioState
  readonly passwordReminder: PasswordReminderState
  readonly scenes: ScenesState
  readonly settings: SettingsState
  readonly wallets: WalletsState
}

const uiInner = combineReducers<UiState, Action>({
  exchangeInfo,
  fio,
  passwordReminder,
  scenes,
  settings,
  wallets
})

export const ui: Reducer<UiState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT') {
    return uiInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }

  return uiInner(state, action)
}
