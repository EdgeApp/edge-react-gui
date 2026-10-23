import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { type EcashSplitStatus, getEcashSplitStatus } from '../util/ecashSplit'
import { useRefresher } from './useRefresher'

/**
 * Polls whether an eCash (ECX) wallet split from a Bitcoin wallet is still
 * waiting on its protection sweep, until the status can no longer change.
 * Returns undefined for anything that is not a Bitcoin wallet, so it is safe
 * to call unconditionally from shared scenes.
 */
export function useEcashSplitPending(
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet,
  delay: number = 15000
): 'unsent' | 'unconfirmed' | undefined {
  const refresher = React.useCallback(
    async () => await getEcashSplitStatus(account, wallet),
    [account, wallet]
  )
  const status = useRefresher<EcashSplitStatus | undefined>(
    refresher,
    undefined,
    delay,
    isSettled
  )
  return status === 'unsent' || status === 'unconfirmed' ? status : undefined
}

const isSettled = (status: EcashSplitStatus | undefined): boolean =>
  status === 'settled'
