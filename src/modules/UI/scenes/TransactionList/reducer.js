// @flow

import type { AbcTransaction } from 'edge-login'
import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'
import * as ACTION from './action'

export type TransactionsState = Array<AbcTransaction>
export type ContactsListState = Array<any>

const transactions = (state: TransactionsState = [], action: Action) => {
  let transactions
  if (!action.data) return state
  switch (action.type) {
    case ACTION.UPDATE_TRANSACTIONS:
      return action.data.transactions
    case ACTION.NEW_TRANSACTIONS:
      transactions = action.data.transactions
      return [...state, ...transactions]
    case ACTION.CHANGED_TRANSACTIONS:
      transactions = action.data.transactions
      return [...state, ...transactions]
    default:
      return state
  }
}

const searchVisible = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case ACTION.TRANSACTIONS_SEARCH_VISIBLE:
      return true
    case ACTION.TRANSACTIONS_SEARCH_HIDDEN:
      return false
    default:
      return state
  }
}

const contactsList = (state: ContactsListState = [], action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_CONTACTS_LIST:
      return action.data
    default:
      return state
  }
}

const updatingBalance = (state: boolean = true, action) => {
  switch (action.type) {
    case ACTION.ENABLE_UPDATING_BALANCE:
      return true
    case ACTION.DISABLE_UPDATING_BALANCE:
      return false
    case ACTION.TOGGLE_UPDATING_BALANCE:
      return !state
    default:
      return state
  }
}

const transactionsWalletListModalVisibility = (state = false, action) => {
  switch (action.type) {
    case ACTION.TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL:
      return !state
    default:
      return state
  }
}

export const transactionList = combineReducers({
  transactions,
  searchVisible,
  contactsList,
  updatingBalance,
  transactionsWalletListModalVisibility
})

export default transactionList
