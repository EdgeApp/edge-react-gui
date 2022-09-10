import { combineReducers, Reducer } from 'redux'

import { Action } from '../../../types/reduxTypes'
import { LoanAccountMap } from '../types'

export type LoanManagerState = {
  readonly loanAccounts: LoanAccountMap
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
  }
})
