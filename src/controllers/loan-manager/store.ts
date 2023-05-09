import { asArray, asBoolean, asJSON, asObject, asOptional, asString, asValue, Cleaner } from 'cleaners'

//
// Store Types
//

export type LoanProgramType = ReturnType<typeof asLoanProgramType>
export const asLoanProgramType = asValue('loan-create', 'loan-deposit', 'loan-borrow', 'loan-repay', 'loan-withdraw', 'loan-close')
export type LoanProgramEdge = ReturnType<typeof asLoanProgramEdge>
export const asLoanProgramEdge = asObject({
  programId: asString,
  programType: asLoanProgramType
})

export type LoanAccountEntry = ReturnType<typeof asLoanAccountEntry>
export const asLoanAccountEntry = asObject({
  closed: asOptional(asBoolean, false),
  walletId: asString,
  borrowPluginId: asString,
  programEdges: asArray(asLoanProgramEdge)
})

//
// Persisted Data (changes require data migration)
//

// Keys:
export const LOAN_MANAGER_STORE_ID = 'loanManager'
export const LOAN_ACCOUNT_MAP = 'loanAccountMap'

// Records:
export interface LoanAccountMapRecord {
  [pluginId: string]: LoanAccountEntry
}
export const asLoanAccountMapRecord: Cleaner<LoanAccountMapRecord> = asOptional(asJSON(asObject(asLoanAccountEntry)), () => ({}))
