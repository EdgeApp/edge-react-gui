// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../modules/ReduxTypes.js'
import type { TransactionListTx } from '../../types.js'

export type TransactionListState = {
  +currentCurrencyCode: string,
  +currentEndIndex: number,
  +currentWalletId: string,
  +numTransactions: number,
  +searchVisible: boolean,
  +transactions: Array<TransactionListTx>
}

const transactions = (state = [], action: Action): Array<TransactionListTx> => {
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

const currentCurrencyCode = (state = '', action: Action): string => {
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

const numTransactions = (state = 0, action: Action): number => {
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

const currentWalletId = (state = '', action: Action): string => {
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

const currentEndIndex = (state = 0, action: Action): number => {
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

const searchVisible = (state = false, action: Action): boolean => {
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

export const transactionList: Reducer<TransactionListState, Action> = combineReducers({
  currentCurrencyCode,
  currentEndIndex,
  currentWalletId,
  numTransactions,
  searchVisible,
  transactions
})
