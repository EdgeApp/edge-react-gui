import type {
  BorrowEngine,
  BorrowPlugin
} from '../../plugins/borrow-plugins/types'
import type { LoanProgramEdge } from './store'

export interface LoanAccount {
  id: string
  borrowPlugin: BorrowPlugin
  borrowEngine: BorrowEngine

  // Action Program Relationships
  programEdges: LoanProgramEdge[]
  closed: boolean
}

export type LoanAccountMap = Record<string, LoanAccount>

export interface LoanManager {
  loanAccounts: LoanAccount[]
}
