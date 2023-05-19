import { EdgeTransaction } from 'edge-core-js'
import { combineReducers, Reducer } from 'redux'

import { Action } from '../../types/reduxTypes'

export interface TransactionListState {
  readonly currentCurrencyCode: string
  readonly currentEndIndex: number
  readonly currentWalletId: string
  readonly numTransactions: number
  readonly transactionIdMap: { [txid: string]: boolean }
  readonly transactions: EdgeTransaction[]
}

const transactions: Reducer<EdgeTransaction[], Action> = (state = [], action) => {
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

const transactionIdMap = (state = {}, action: Action): { [txid: string]: boolean } => {
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

export const transactionList = combineReducers<TransactionListState, Action>({
  currentCurrencyCode,
  currentEndIndex,
  currentWalletId,
  numTransactions,
  transactionIdMap,
  transactions
})
