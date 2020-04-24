// @flow

import { type Reducer, combineReducers } from 'redux'

import { type FioState, fio } from '../../reducers/FioReducer.js'
import { type PasswordReminderState, passwordReminder } from '../../reducers/PasswordReminderReducer.js'
import { type ScenesState, scenes } from '../../reducers/scenes/ScenesReducer.js'
import { type SettingsState, settings } from '../../reducers/scenes/SettingsReducer.js'
import { type WalletsState, wallets } from '../../reducers/scenes/WalletsReducer.js'
import { type Action } from '../../types/reduxTypes.js'

export { fio, passwordReminder, scenes, wallets, settings }

export type UiState = {
  +fio: FioState,
  +passwordReminder: PasswordReminderState,
  +scenes: ScenesState,
  +settings: SettingsState,
  +wallets: WalletsState
}

const uiInner: Reducer<UiState, Action> = combineReducers({
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
