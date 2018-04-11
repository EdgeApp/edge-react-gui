/* eslint-disable flowtype/require-valid-file-annotation */

import { combineReducers } from 'redux'

import * as ACTION from './action.js'

export const subcategories = (state = [], action) => {
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
