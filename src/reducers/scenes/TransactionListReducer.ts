import { combineReducers, Reducer } from 'redux'

import { Action } from '../../types/reduxTypes'
import { TransactionListTx } from '../../types/types'

export type TransactionListState = {
  readonly currentCurrencyCode: string
  readonly currentEndIndex: number
  readonly currentWalletId: string
  readonly numTransactions: number
  readonly transactionIdMap: { [txid: string]: TransactionListTx }
  readonly transactions: TransactionListTx[]
}

const transactions = (state = [], action: Action): TransactionListTx[] => {
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      return action.data.transactions
    }

    case 'UI/WALLETS/SELECT_WALLET': {
      return []
    }

    default:
      return state
  }
}

const transactionIdMap = (state = {}, action: Action): { [txid: string]: TransactionListTx } => {
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      return action.data.transactionIdMap
    }

    case 'UI/WALLETS/SELECT_WALLET': {
      return {}
    }

    default:
      return state
  }
}

const currentCurrencyCode = (state = '', action: Action): string => {
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      return action.data.currentCurrencyCode
    }

    default:
      return state
  }
}

const numTransactions = (state = 0, action: Action): number => {
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      return action.data.numTransactions
    }

    default:
      return state
  }
}

const currentWalletId = (state = '', action: Action): string => {
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      return action.data.currentWalletId
    }

    default:
      return state
  }
}

const currentEndIndex = (state = 0, action: Action): number => {
  switch (action.type) {
    case 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS': {
      return action.data.currentEndIndex
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
  transactionIdMap,
  transactions
})
