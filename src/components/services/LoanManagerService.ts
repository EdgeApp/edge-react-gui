import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { deleteLoanAccount, loadLoanAccounts } from '../../controllers/loan-manager/redux/actions'
import { LoanAccountMap } from '../../controllers/loan-manager/types'
import { checkLoanHasFunds } from '../../controllers/loan-manager/util/checkLoanHasFunds'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDispatch, useSelector } from '../../types/reactRedux'

export const LoanManagerService = () => {
  const dispatch = useDispatch()
  const account: EdgeAccount = useSelector(state => state.core.account)
  const loanAccountMap: LoanAccountMap = useSelector(state => state.loanManager.loanAccounts)

  //
  // Initialization
  //

  useAsyncEffect(async () => {
    if (account.disklet != null) {
      dispatch(loadLoanAccounts(account))
    }
  }, [account, dispatch])

  //
  // Cleanup Routine
  //

  React.useEffect(() => {
    const cleanup = () => {
      for (const loanAccount of Object.values(loanAccountMap)) {
        if (!checkLoanHasFunds(loanAccount) && loanAccount.closed) {
          dispatch(deleteLoanAccount(loanAccount))
        }
      }
    }
    const intervalId = setInterval(cleanup, 3000)
    return () => {
      clearInterval(intervalId)
    }
  }, [dispatch, loanAccountMap])

  return null
}
