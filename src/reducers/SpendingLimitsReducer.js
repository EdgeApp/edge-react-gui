// @flow

import { combineReducers } from 'redux'

// ACTIONS
import type { Action } from '../modules/ReduxTypes.js'

export type SpendingLimits = {
  transaction: {
    isEnabled: boolean,
    amount: number
  }
}

export const newSpendingLimits = (spendingLimits: SpendingLimits) => ({
  type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
  data: { spendingLimits }
})

// REDUCERS
export const initialState = {
  transaction: {
    isEnabled: false,
    amount: 0
  }
}

export const isEnabled = (state: boolean = initialState.transaction.isEnabled, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case 'ACCOUNT_INIT_COMPLETE':
    case 'SPENDING_LIMITS/NEW_SPENDING_LIMITS': {
      // $FlowFixMe
      return action.data.spendingLimits.transaction.isEnabled
    }
    default:
      return state
  }
}

export const amount = (state: number = initialState.transaction.amount, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case 'ACCOUNT_INIT_COMPLETE':
    case 'SPENDING_LIMITS/NEW_SPENDING_LIMITS': {
      // $FlowFixMe
      return action.data.spendingLimits.transaction.amount
    }
    default:
      return state
  }
}

export const transaction = combineReducers({
  isEnabled,
  amount
})

export const spendingLimits = combineReducers({
  transaction
})
