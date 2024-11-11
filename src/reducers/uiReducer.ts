import { combineReducers, Reducer } from 'redux'

import { ExchangeInfo } from '../actions/ExchangeInfoActions'
import { Action } from '../types/reduxTypes'
import { exchangeInfo } from './ExchangeInfoReducer'
import { fio, FioState } from './FioReducer'
import { passwordReminder, PasswordReminderState } from './PasswordReminderReducer'
import { fioAddress, FioAddressSceneState } from './scenes/FioAddressSceneReducer'
import { settings, SettingsState } from './scenes/SettingsReducer'
import { wallets, WalletsState } from './scenes/WalletsReducer'

export interface UiState {
  readonly exchangeInfo: ExchangeInfo
  readonly fio: FioState
  readonly fioAddress: FioAddressSceneState
  readonly passwordReminder: PasswordReminderState
  readonly settings: SettingsState
  readonly notificationHeight: number
  readonly subcategories: string[]
  readonly wallets: WalletsState
}

const uiInner = combineReducers<UiState, Action>({
  exchangeInfo,
  fio,
  fioAddress,
  passwordReminder,
  settings,
  notificationHeight(state = 0, action) {
    if (action.type === 'UI/SET_NOTIFICATION_HEIGHT') {
      return action.data.height
    }
    return state
  },

  subcategories(state = [], action) {
    switch (action.type) {
      case 'SET_TRANSACTION_SUBCATEGORIES':
        return action.data.subcategories
      default:
        return state
    }
  },

  wallets
})

export const ui: Reducer<UiState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT') {
    return uiInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }

  return uiInner(state, action)
}
