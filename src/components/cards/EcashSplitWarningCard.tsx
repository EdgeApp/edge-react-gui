import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useEcashSplitPending } from '../../hooks/useEcashSplitPending'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { AlertCardUi4 } from './AlertCard'

interface Props {
  wallet: EdgeCurrencyWallet
}

/**
 * Warns on a Bitcoin wallet while an eCash (ECX) wallet split from it has not
 * confirmed its replay protection sweep. Until then, a Bitcoin send can be
 * replayed on ECX and move the matching ECX too.
 *
 * Renders nothing for other wallets, so shared scenes can mount it as-is.
 */
export const EcashSplitWarningCard: React.FC<Props> = props => {
  const { wallet } = props
  const account = useSelector(state => state.core.account)
  const pending = useEcashSplitPending(account, wallet)

  if (pending == null) return null
  return (
    <AlertCardUi4
      title={lstrings.ecash_split_pending_title}
      type="warning"
      body={
        pending === 'unsent'
          ? lstrings.ecash_split_unsent_body
          : lstrings.ecash_split_pending_body
      }
      marginRem={[0.5, 0.5, 0, 0.5]}
    />
  )
}
