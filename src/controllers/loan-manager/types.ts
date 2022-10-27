import { BorrowEngine, BorrowPlugin } from '../../plugins/borrow-plugins/types'
import { LoanProgramEdge } from './store'

export interface LoanAccount {
  id: string
  borrowPlugin: BorrowPlugin
  borrowEngine: BorrowEngine

  // Action Program Relationships
  programEdges: LoanProgramEdge[]
  closed: boolean
}

export interface LoanAccountMap {
  [walletId: string]: LoanAccount
}

export interface LoanManager {
  loanAccounts: LoanAccount[]
}
