// @flow

import { type BorrowEngine, type BorrowPlugin } from '../../plugins/borrow-plugins/types'
import { type LoanProgramEdge } from './store'

export type LoanAccount = {
  id: string,
  borrowPlugin: BorrowPlugin,
  borrowEngine: BorrowEngine,

  // Action Program Relationships
  programEdges: LoanProgramEdge[]
}

export type LoanAccountMap = {
  [walletId: string]: LoanAccount
}

export type LoanManager = {
  loanAccounts: LoanAccount[]
}
