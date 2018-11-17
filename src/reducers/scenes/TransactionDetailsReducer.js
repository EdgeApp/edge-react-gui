// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../modules/ReduxTypes.js'

export type TransactionDetailsState = {
  subcategories: Array<string>
}

const subcategories = (state = [], action: Action): Array<string> => {
  if (!action.data) return state
  switch (action.type) {
    case 'SET_TRANSACTION_SUBCATEGORIES': {
      // console.log('in subcategories reducer, action is: ', action)
      // $FlowFixMe
      return action.data.subcategories
    }

    default:
      return state
  }
}

export const transactionDetails: Reducer<TransactionDetailsState, Action> = combineReducers({
  subcategories
})
