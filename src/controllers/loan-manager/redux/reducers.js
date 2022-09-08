// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../../types/reduxTypes'
import { type LoanAccountMap } from '../types'

export type LoanManagerState = {
  +loanAccounts: LoanAccountMap,
  lastResyncTimestamp: number,
  +syncRatio: number
}

export const loanManager: Reducer<LoanManagerState, Action> = combineReducers({
  loanAccounts(state: LoanAccountMap = {}, action: Action): LoanAccountMap {
    switch (action.type) {
      case 'LOAN_MANAGER/SET_LOAN_ACCOUNT': {
        const { loanAccount } = action
        return {
          ...state,
          [loanAccount.id]: loanAccount
        }
      }
      case 'LOAN_MANAGER/DELETE_LOAN_ACCOUNT': {
        const { id } = action
        const { [id]: _, ...remainingState } = state
        return remainingState
      }
      case 'LOGOUT': {
        return {}
      }
      default:
        return state
    }
  },
  lastResyncTimestamp(state: number = 0, action: Action): number {
    switch (action.type) {
      case 'LOAN_MANAGER/SET_SYNC_RATIO': {
        return Date.now()
      }
    }
    return state
  },
  syncRatio(state: number = 0, action: Action): number {
    switch (action.type) {
      case 'LOAN_MANAGER/SET_SYNC_RATIO': {
        return action.syncRatio
      }
    }
    return state
  }
})
