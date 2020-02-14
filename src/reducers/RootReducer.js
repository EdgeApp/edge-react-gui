// @flow

import { type Reducer, combineReducers } from 'redux'

import { type ExchangeRatesState, exchangeRates } from '../modules/ExchangeRates/reducer.js'
import { type UiState, ui } from '../modules/UI/reducer.js'
import { type Action } from '../types/reduxTypes.js'
import { type ContactsState, contacts } from './ContactsReducer.js'
import { type CoreState, core } from './CoreReducer.js'
import { type CryptoExchangeState, cryptoExchange } from './CryptoExchangeReducer.js'
import { type PermissionsState, permissions } from './PermissionsReducer.js'

export type RootState = {
  // Next username to auto-fill at the login screen, or blank if none:
  +nextUsername: string | null,

  // Nested reducers:
  +contacts: ContactsState,
  +core: CoreState,
  +cryptoExchange: CryptoExchangeState,
  +exchangeRates: ExchangeRatesState,
  +permissions: PermissionsState,
  +ui: UiState
}

export const rootReducer: Reducer<RootState, Action> = combineReducers({
  nextUsername (state: string | null = null, action: Action): string | null {
    switch (action.type) {
      case 'DEEP_LINK_RECEIVED':
        return null
      case 'LOGOUT': {
        const { username = null } = action.data
        return username
      }
    }
    return state
  },

  // Nested reducers:
  contacts,
  core,
  cryptoExchange,
  exchangeRates,
  permissions,
  ui
})
