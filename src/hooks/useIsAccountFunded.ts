import * as React from 'react'

import { useSelector } from '../types/reactRedux'
import { zeroString } from '../util/utils'
import { useWatch } from './useWatch'

/**
 * Checks if the account has any balances
 */
export function useIsAccountFunded(): boolean {
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const walletsSynced = useSelector(state => {
    const { currencyWallets } = state.core.account
    const { userPausedWalletsSet } = state.ui.settings
    const unPausedWallets = Object.values(currencyWallets).filter(wallet => !userPausedWalletsSet?.has(wallet.id))
    const unSyncedWallets = unPausedWallets.filter(wallet => wallet.syncRatio < 1)

    return unSyncedWallets.length === 0
  })

  const [accountFunded, setAccountFunded] = React.useState<boolean>(false)

  // Set account funded status
  React.useEffect(() => {
    if (!walletsSynced) return
    setAccountFunded(Object.values(currencyWallets).some(wallet => [...wallet.balanceMap.values()].some(balanceVal => !zeroString(balanceVal))))
  }, [currencyWallets, walletsSynced])

  return accountFunded
}
