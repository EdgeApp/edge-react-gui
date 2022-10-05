import { EdgeCurrencyWallet } from 'edge-core-js'

import { BorrowPlugin } from '../../plugins/borrow-plugins/types'
import { LoanAccount } from './types'

export const makeLoanAccount = async (borrowPlugin: BorrowPlugin, wallet: EdgeCurrencyWallet): Promise<LoanAccount> => {
  // LoanAccounts are a one-to-one relationship to the currency wallet
  const id = wallet.id
  const borrowEngine = await borrowPlugin.makeBorrowEngine(wallet)
  const loanAccount: LoanAccount = {
    id,
    borrowPlugin,
    borrowEngine,
    closed: false,
    programEdges: []
  }
  return loanAccount
}
