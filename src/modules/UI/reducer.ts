import { combineReducers, Reducer } from 'redux'

import { ExchangeInfo } from '../../actions/ExchangeInfoActions'
import { exchangeInfo } from '../../reducers/ExchangeInfoReducer'
import { fio, FioState } from '../../reducers/FioReducer'
import { passwordReminder, PasswordReminderState } from '../../reducers/PasswordReminderReducer'
import { scenes, ScenesState } from '../../reducers/scenes/ScenesReducer'
import { settings, SettingsState } from '../../reducers/scenes/SettingsReducer'
import { wallets, WalletsState } from '../../reducers/scenes/WalletsReducer'
import { Action } from '../../types/reduxTypes'

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
