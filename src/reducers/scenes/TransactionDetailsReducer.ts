import { combineReducers, Reducer } from 'redux'

import { Action } from '../../types/reduxTypes'

export type TransactionDetailsState = {
  subcategories: string[]
}

const subcategories: Reducer<string[], Action> = (state = [], action) => {
  switch (action.type) {
    case 'SET_TRANSACTION_SUBCATEGORIES': {
      return action.data.subcategories
    }

    default:
      return state
  }
}

export const transactionDetails: Reducer<TransactionDetailsState, Action> = combineReducers({
  subcategories
})
