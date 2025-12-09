import { combineReducers, type Reducer } from 'redux'

import type { ExchangeInfo } from '../actions/ExchangeInfoActions'
import type { Action } from '../types/reduxTypes'
import { exchangeInfo } from './ExchangeInfoReducer'
import { fio, type FioState } from './FioReducer'
import {
  passwordReminder,
  type PasswordReminderState
} from './PasswordReminderReducer'
import {
  fioAddress,
  type FioAddressSceneState
} from './scenes/FioAddressSceneReducer'
import { settings, type SettingsState } from './scenes/SettingsReducer'

export interface UiState {
  readonly exchangeInfo: ExchangeInfo
  readonly fio: FioState
  readonly fioAddress: FioAddressSceneState
  readonly passwordReminder: PasswordReminderState
  readonly settings: SettingsState
  readonly notificationHeight: number
  readonly subcategories: string[]
  readonly countryCode: string
}

const uiInner = combineReducers<UiState, Action>({
  exchangeInfo,
  fio,
  fioAddress,
  passwordReminder,
  settings,
  countryCode(state: string = 'US', action) {
    if (action.type === 'UI/SET_COUNTRY_CODE')
      return action.data.countryCode ?? state
    return state
  },
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
  }
})

export const ui: Reducer<UiState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT') {
    return uiInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }

  return uiInner(state, action)
}
