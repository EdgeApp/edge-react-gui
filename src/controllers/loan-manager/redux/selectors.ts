import { RootState } from '../../../reducers/RootReducer'
import { LoanAccount } from '../types'

export const selectLoanAccount = (state: RootState, loanAccountId: string): LoanAccount | undefined => {
  return state.loanManager.loanAccounts[loanAccountId]
}
