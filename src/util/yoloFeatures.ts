import { EdgeCurrencyWallet } from 'edge-core-js/types'

import { LoanAccount } from '../controllers/loan-manager/types'
import { waitForBorrowEngineSync } from '../controllers/loan-manager/util/waitForLoanAccountSync'
import { BorrowEngine } from '../plugins/borrow-plugins/types'
import { borrowPlugins } from '../plugins/helpers/borrowPluginHelpers'

export const yoloRefreshBorrowEngine = async (loanAccount: LoanAccount): Promise<void> => {
  const borrowEngine = loanAccount.borrowEngine
  await borrowEngine.startEngine()
  await waitForBorrowEngineSync(borrowEngine)

  // makeLoanAccount

  // // Collaterals and Debts:
  // const reserveTokenBalances = await aaveNetwork.getReserveTokenBalances(walletAddress)
  // const collaterals: BorrowCollateral[] = reserveTokenBalances.map(({ address, aBalance }) => {
  //   return {
  //     tokenId: addressToTokenId(address),
  //     nativeAmount: aBalance.toString()
  //   }
  // })
  // const debts: BorrowDebt[] = reserveTokenBalances.map(({ address, vBalance, variableApr }) => {
  //   return {
  //     tokenId: addressToTokenId(address),
  //     nativeAmount: vBalance.toString(),
  //     apr: variableApr
  //   }
  // })
  // instance.collaterals = collaterals
  // instance.debts = debts
}
