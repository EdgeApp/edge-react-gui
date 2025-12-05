import { combineReducers } from 'redux'

import type { Action } from '../types/reduxTypes'
import type { SpendingLimits } from '../types/types'

export const initialState: SpendingLimits = {
  transaction: {
    isEnabled: false,
    amount: 0
  }
}

export const isEnabled = (
  state: boolean = initialState.transaction.isEnabled,
  action: Action
): boolean => {
  switch (action.type) {
    case 'LOGIN': {
      return action.data.localSettings.spendingLimits.transaction.isEnabled
    }
    case 'SPENDING_LIMITS/NEW_SPENDING_LIMITS': {
      return action.data.spendingLimits.transaction.isEnabled
    }
    default:
      return state
  }
}

export const amount = (
  state: number = initialState.transaction.amount,
  action: Action
): number => {
  switch (action.type) {
    case 'LOGIN': {
      return action.data.localSettings.spendingLimits.transaction.amount
    }
    case 'SPENDING_LIMITS/NEW_SPENDING_LIMITS': {
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

export const spendingLimits = combineReducers<SpendingLimits, Action>({
  transaction
})
