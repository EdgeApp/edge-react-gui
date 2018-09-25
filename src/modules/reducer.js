// @flow

import { type Reducer, combineReducers } from 'redux'

import { type ContactsState, contacts } from '../reducers/contacts/contactsReducer.js'
import { type CryptoExchangeState, cryptoExchange } from '../reducers/CryptoExchangeReducer.js'
import { type PermissionsState, permissions } from '../reducers/permissions/permissionsReducer.js'
import { type CoreState, core } from './Core/reducer.js'
import { type ExchangeRatesState, exchangeRates } from './ExchangeRates/reducer.js'
import { type Action } from './ReduxTypes.js'
import { type UiState, ui } from './UI/reducer.js'

export { core, ui, cryptoExchange, exchangeRates, permissions, contacts }

export type RootState = {
  +core: CoreState,
  +ui: UiState,
  +cryptoExchange: CryptoExchangeState,
  +exchangeRates: ExchangeRatesState,
  +permissions: PermissionsState,
  +contacts: ContactsState
}

export const rootReducer: Reducer<RootState, Action> = combineReducers({
  core,
  ui,
  cryptoExchange,
  exchangeRates,
  permissions,
  contacts
})
