// @flow

import type { EdgeTransaction } from 'edge-core-js'
import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'

export type TransactionAlertState = {
  +displayAlert: boolean,
  +edgeTransaction: EdgeTransaction // | ''
}

const displayAlert = (state = false, action: Action): boolean => {
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

const edgeTransaction = (state = '', action: Action): EdgeTransaction | '' => {
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

// $FlowFixMe
export const transactionAlert: Reducer<TransactionAlertState, Action> = combineReducers({
  displayAlert,
  edgeTransaction
})
