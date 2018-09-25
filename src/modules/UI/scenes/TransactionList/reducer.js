// @flow

import type { EdgeTransaction } from 'edge-core-js'
import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'

export type TransactionsState = Array<EdgeTransaction>

const transactions = (state: TransactionsState = [], action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      // $FlowFixMe
      return action.data.transactions
    }

    case 'UI/WALLETS/SELECT_WALLET': {
      return []
    }

    default:
      return state
  }
}

const currentCurrencyCode = (state: string = '', action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      // $FlowFixMe
      return action.data.currentCurrencyCode
    }

    default:
      return state
  }
}

const numTransactions = (state: number = 0, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      // $FlowFixMe
      return action.data.numTransactions
    }

    default:
      return state
  }
}

const currentWalletId = (state: string = '', action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      // $FlowFixMe
      return action.data.currentWalletId
    }

    default:
      return state
  }
}

const currentEndIndex = (state: number = 0, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      // $FlowFixMe
      return action.data.currentEndIndex
    }

    default:
      return state
  }
}

const searchVisible = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/TRANSACTIONS_SEARCH_VISIBLE': {
      return true
    }

    case 'UI/SCENES/TRANSACTION_LIST/TRANSACTIONS_SEARCH_HIDDEN': {
      return false
    }

    default:
      return state
  }
}

const updatingBalance = (state: boolean = true, action: Action) => {
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/ENABLE_UPDATING_BALANCE': {
      return true
    }

    case 'UI/SCENES/TRANSACTION_LIST/DISABLE_UPDATING_BALANCE': {
      return false
    }

    case 'UI/SCENES/TRANSACTION_LIST/TOGGLE_UPDATING_BALANCE': {
      return !state
    }

    default:
      return state
  }
}

const loadingTransactions = (state = false, action: Action) => {
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/START_TRANSACTIONS_LOADING': {
      return true
    }

    case 'UI/SCENES/TRANSACTION_LIST/END_TRANSACTIONS_LOADING': {
      return false
    }

    default:
      return state
  }
}

export const transactionList = combineReducers({
  transactions,
  currentCurrencyCode,
  currentWalletId,
  numTransactions,
  currentEndIndex,
  searchVisible,
  updatingBalance,
  loadingTransactions
})

export default transactionList
