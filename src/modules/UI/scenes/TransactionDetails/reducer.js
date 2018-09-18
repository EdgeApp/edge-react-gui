// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'
import * as ACTION from './action.js'

export const subcategories = (state: boolean = false, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case ACTION.SET_TRANSACTION_SUBCATEGORIES:
      // console.log('in subcategories reducer, action is: ', action)
      return action.data.subcategories
    default:
      return state
  }
}

export const transactionDetails = combineReducers({
  subcategories
})

export default transactionDetails
