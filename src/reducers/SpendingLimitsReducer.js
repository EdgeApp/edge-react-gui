// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../types/reduxTypes.js'
import type { PluginSpendingLimits, SpendingLimits } from '../types/types'

export type SpendingLimitsState = {
  pluginLimits: { [key: string]: PluginSpendingLimits }
} & SpendingLimits

export const DEFAULT_PLUGIN_SPENDING_LIMITS: PluginSpendingLimits = {
  transaction: {
    isEnabled: false,
    amount: 0
  },
  fiatCurrencyCode: 'USD'
}

// REDUCERS
export const initialState = {
  transaction: {
    isEnabled: false,
    amount: 0
  },
  pluginLimits: {}
}

export const isEnabled = (state: boolean = initialState.transaction.isEnabled, action: Action) => {
  switch (action.type) {
    case 'ACCOUNT_INIT_COMPLETE':
    case 'SPENDING_LIMITS/NEW_SPENDING_LIMITS': {
      return action.data.spendingLimits.transaction.isEnabled
    }
    default:
      return state
  }
}

export const amount = (state: number = initialState.transaction.amount, action: Action) => {
  switch (action.type) {
    case 'ACCOUNT_INIT_COMPLETE':
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

export const pluginLimits: Reducer<{ [key: string]: PluginSpendingLimits }, Action> = (state = initialState.pluginLimits, action: Action) => {
  switch (action.type) {
    case 'ACCOUNT_INIT_COMPLETE': {
      return {
        ...state,
        ...action.data.spendingLimits.pluginLimits
      }
    }
    case 'SPENDING_LIMITS/NEW_SPENDING_LIMITS': {
      if (!action.data.currencyCode || !action.data.fiatCurrencyCode) return state

      return {
        ...state,
        [action.data.currencyCode]: {
          ...action.data.spendingLimits,
          fiatCurrencyCode: action.data.fiatCurrencyCode
        }
      }
    }
    default:
      return state
  }
}

export const spendingLimits = combineReducers({
  transaction,
  pluginLimits
})
