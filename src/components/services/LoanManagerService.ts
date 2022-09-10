import { EdgeAccount } from 'edge-core-js'

import { borrowPluginMap } from '../../controllers/loan-manager/borrowPluginConfig'
import { loadLoanAccounts } from '../../controllers/loan-manager/redux/actions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDispatch, useSelector } from '../../types/reactRedux'

export const LoanManagerService = () => {
  const dispatch = useDispatch()
  const account: EdgeAccount = useSelector(state => state.core.account)

  //
  // Initialization
  //

  useAsyncEffect(async () => {
    if (account.disklet != null) {
      dispatch(loadLoanAccounts(account, borrowPluginMap))
    }
  }, [account, dispatch])

  return null
}
