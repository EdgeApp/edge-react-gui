import { BorrowEngine, BorrowPlugin } from '../../plugins/borrow-plugins/types'
import { LoanProgramEdge } from './store'

export type LoanAccount = {
  id: string
  borrowPlugin: BorrowPlugin
  borrowEngine: BorrowEngine

  // Action Program Relationships
  programEdges: LoanProgramEdge[]
  closed: boolean
}

export type LoanAccountMap = {
  [walletId: string]: LoanAccount
}

export type LoanManager = {
  loanAccounts: LoanAccount[]
}
