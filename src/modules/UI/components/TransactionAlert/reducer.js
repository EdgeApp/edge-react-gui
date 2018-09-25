// @flow

import type { EdgeTransaction } from 'edge-core-js'
import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'

const displayAlert = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case 'UI/COMPONENTS/TRANSACTION_ALERT/DISPLAY_TRANSACTION_ALERT': {
      return true
    }

    case 'UI/COMPONENTS/TRANSACTION_ALERT/DISMISS_TRANSACTION_ALERT': {
      return false
    }

    default:
      return state
  }
}

type EdgeTransactionState = EdgeTransaction | ''

const edgeTransaction = (state: EdgeTransactionState = '', action: Action) => {
  switch (action.type) {
    case 'UI/COMPONENTS/TRANSACTION_ALERT/DISPLAY_TRANSACTION_ALERT': {
      if (!action.data) throw new Error('Invalid action')
      return action.data.edgeTransaction
    }

    case 'UI/COMPONENTS/TRANSACTION_ALERT/DISMISS_TRANSACTION_ALERT': {
      return ''
    }

    default:
      return state
  }
}

export const transactionAlert = combineReducers({
  displayAlert,
  edgeTransaction
})

export default transactionAlert
