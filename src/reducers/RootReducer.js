// @flow

import { type Reducer, combineReducers } from 'redux'

import { type ExchangeRatesState, exchangeRates } from '../modules/ExchangeRates/reducer.js'
import { type UiState, ui } from '../modules/UI/reducer.js'
import { type DeepLink } from '../types/DeepLink.js'
import { type Action } from '../types/reduxTypes.js'
import { type DeviceReferral } from '../types/ReferralTypes.js'
import { type AccountState, account } from './AccountReducer.js'
import { type ContactsState, contacts } from './ContactsReducer.js'
import { type CoreState, core } from './CoreReducer.js'
import { type CryptoExchangeState, cryptoExchange } from './CryptoExchangeReducer.js'
import { type NetworkState, network } from './NetworkReducer.js'
import { type PermissionsState, permissions } from './PermissionsReducer.js'

const defaultDeviceReferral: DeviceReferral = { messages: [], plugins: [] }

export type RootState = {
  +deviceReferral: DeviceReferral,

  // Next username to auto-fill at the login screen, or blank if none:
  +nextUsername: string | null,
  +showMainApp: boolean,

  // Deep link waiting to be fulfilled:
  +pendingDeepLink: DeepLink | null,

  // Nested reducers:
  +account: AccountState,
  +contacts: ContactsState,
  +core: CoreState,
  +cryptoExchange: CryptoExchangeState,
  +exchangeRates: ExchangeRatesState,
  +permissions: PermissionsState,
  +ui: UiState,
  +network: NetworkState
}

export const rootReducer: Reducer<RootState, Action> = combineReducers({
  deviceReferral (state: DeviceReferral = defaultDeviceReferral, action: Action): DeviceReferral {
    return action.type === 'DEVICE_REFERRAL_LOADED' ? action.data : state
  },

  nextUsername (state: string | null = null, action: Action): string | null {
    switch (action.type) {
      case 'LOGOUT': {
        const { username = null } = action.data
        return username
      }
    }
    return state
  },

  showMainApp (state: boolean = true, action: Action): boolean {
    switch (action.type) {
      case 'LOGOUT':
        return false
      case 'SHOW_MAIN_APP':
        return true
    }
    return state
  },

  pendingDeepLink (state: DeepLink | null = null, action: Action): DeepLink | null {
    switch (action.type) {
      case 'DEEP_LINK_RECEIVED':
        return action.data
      case 'DEEP_LINK_HANDLED':
        return null
    }
    return state
  },

  // Nested reducers:
  account,
  contacts,
  core,
  cryptoExchange,
  exchangeRates,
  permissions,
  ui,
  network
})
