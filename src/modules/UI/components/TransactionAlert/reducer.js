// @flow

import type { AbcTransaction } from 'edge-core-js'
import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'
import * as ACTIONS from './actions'

const displayAlert = (state: boolean = false, action: Action) => {
  const { type } = action
  switch (type) {
    case ACTIONS.DISPLAY_TRANSACTION_ALERT:
      return true
    case ACTIONS.DISMISS_TRANSACTION_ALERT:
      return false
    default:
      return state
  }
}

type AbcTransactionState = AbcTransaction | ''

const abcTransaction = (state: AbcTransactionState = '', action: Action) => {
  switch (action.type) {
    case ACTIONS.DISPLAY_TRANSACTION_ALERT:
      if (action.data) {
        return action.data.abcTransaction
      }
      return state
    case ACTIONS.DISMISS_TRANSACTION_ALERT:
      return ''
    default:
      return state
  }
}

export const transactionAlert = combineReducers({
  displayAlert,
  abcTransaction
})

export default transactionAlert
