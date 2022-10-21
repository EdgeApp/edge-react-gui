import { add, gt } from 'biggystring'

import { BorrowEngine } from '../../../plugins/borrow-plugins/types'

export const checkLoanHasFunds = (borrowEngine: BorrowEngine): boolean => {
  const hasDebt = gt(
    borrowEngine.debts.reduce((sum, debt) => add(sum, debt.nativeAmount), '0'),
    '0'
  )
  const hasCollateral = gt(
    borrowEngine.collaterals.reduce((sum, collateral) => add(sum, collateral.nativeAmount), '0'),
    '0'
  )
  return hasDebt || hasCollateral
}
