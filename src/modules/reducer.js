// @flow

import { combineReducers } from 'redux'

import { contactsReducer as contacts } from '../reducers/contacts/indexContacts.js'
import cryptoExchange from '../reducers/CryptoExchangeReducer.js'
import { permissionsReducer as permissions } from '../reducers/permissions/indexPermissions.js'
import { core } from './Core/reducer.js'
import { exchangeRates } from './ExchangeRates/reducer.js'
import { ui } from './UI/reducer.js'

export { core, ui, cryptoExchange, exchangeRates, permissions, contacts }

export const rootReducer = combineReducers({
  core,
  ui,
  cryptoExchange,
  exchangeRates,
  permissions,
  contacts
})

export default rootReducer
