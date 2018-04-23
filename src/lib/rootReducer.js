// @flow

import { combineReducers } from 'redux'

import { core } from '../modules/Core/reducer.js'
import { exchangeRates } from '../modules/ExchangeRates/reducer.js'
import { ui } from '../modules/UI/reducer.js'
import { contactsReducer as contacts } from '../reducers/contacts/indexContacts.js'
import cryptoExchange from '../reducers/CryptoExchangeReducer'
import { permissionsReducer as permissions } from '../reducers/permissions/indexPermissions.js'

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
