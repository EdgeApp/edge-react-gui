// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../types/reduxTypes.js'

export type TransactionDetailsState = {
  subcategories: string[]
}

const subcategories = (state = [], action: Action): string[] => {
  switch (action.type) {
    case 'SET_TRANSACTION_SUBCATEGORIES': {
      return action.data.subcategories
    }

    default:
      return state
  }
}

export const transactionDetails: Reducer<TransactionDetailsState, Action> =
  combineReducers({
    subcategories
  })
