// @flow

import { type Reducer, combineReducers } from 'redux'

import { type UiState, ui } from '../modules/UI/reducer.js'
import { type DeepLink } from '../types/DeepLinkTypes.js'
import { type Action } from '../types/reduxTypes.js'
import { type DeviceReferral } from '../types/ReferralTypes.js'
import { type GuiContact, type GuiExchangeRates } from '../types/types.js'
import { type AccountState, account } from './AccountReducer.js'
import { type CoreState, core } from './CoreReducer.js'
import { type CryptoExchangeState, cryptoExchange } from './CryptoExchangeReducer.js'
import { type NetworkState, network } from './NetworkReducer.js'
import { type PermissionsState, permissions } from './PermissionsReducer.js'

const defaultDeviceReferral: DeviceReferral = { messages: [], plugins: [] }

export type RootState = {
  +contacts: GuiContact[],
  +deviceReferral: DeviceReferral,
  +exchangeRates: GuiExchangeRates,

  // Next username to auto-fill at the login screen, or blank if none:
  +nextUsername: string | null,

  // Deep link waiting to be fulfilled:
  +pendingDeepLink: DeepLink | null,

  // Nested reducers:
  +account: AccountState,
  +core: CoreState,
  +cryptoExchange: CryptoExchangeState,
  +permissions: PermissionsState,
  +ui: UiState,
  +network: NetworkState
}

export const rootReducer: Reducer<RootState, Action> = combineReducers({
  contacts(state: GuiContact[] = [], action: Action): GuiContact[] {
    return action.type === 'CONTACTS/LOAD_CONTACTS_SUCCESS' ? action.data.contacts : state
  },

  deviceReferral(state: DeviceReferral = defaultDeviceReferral, action: Action): DeviceReferral {
    return action.type === 'DEVICE_REFERRAL_LOADED' ? action.data : state
  },

  exchangeRates: (state = {}, action: Action): GuiExchangeRates => {
    switch (action.type) {
      case 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES':
        return action.data.exchangeRates
      case 'LOGOUT':
        return {}
    }
    return state
  },

  nextUsername(state: string | null = null, action: Action): string | null {
    switch (action.type) {
      case 'LOGOUT': {
        const { username = null } = action.data
        return username
      }
    }
    return state
  },

  pendingDeepLink(state: DeepLink | null = null, action: Action): DeepLink | null {
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
  core,
  cryptoExchange,
  permissions,
  ui,
  network
})
