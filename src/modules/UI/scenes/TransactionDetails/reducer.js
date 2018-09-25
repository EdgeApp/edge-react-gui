// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'

export const subcategories = (state: Array<string> = [], action: Action) => {
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

export const transactionDetails = combineReducers({
  subcategories
})

export default transactionDetails
