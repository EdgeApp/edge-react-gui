import { combineReducers, Reducer } from 'redux'

import { ExchangeInfo } from '../actions/ExchangeInfoActions'
import { Action } from '../types/reduxTypes'
import { exchangeInfo } from './ExchangeInfoReducer'
import { fio, FioState } from './FioReducer'
import { passwordReminder, PasswordReminderState } from './PasswordReminderReducer'
import { createWallet, CreateWalletState } from './scenes/CreateWalletReducer'
import { fioAddress, FioAddressSceneState } from './scenes/FioAddressSceneReducer'
import { sendConfirmation, SendConfirmationState } from './scenes/SendConfirmationReducer'
import { settings, SettingsState } from './scenes/SettingsReducer'
import { wallets, WalletsState } from './scenes/WalletsReducer'

export interface UiState {
  readonly createWallet: CreateWalletState
  readonly exchangeInfo: ExchangeInfo
  readonly fio: FioState
  readonly fioAddress: FioAddressSceneState
  readonly passwordReminder: PasswordReminderState
  readonly sendConfirmation: SendConfirmationState
  readonly settings: SettingsState
  readonly subcategories: string[]
  readonly wallets: WalletsState
}

const uiInner = combineReducers<UiState, Action>({
  createWallet,
  exchangeInfo,
  fio,
  fioAddress,
  passwordReminder,
  sendConfirmation,
  settings,

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
