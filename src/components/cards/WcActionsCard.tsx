import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import {
  describeWcAction,
  type WcAction
} from '../../util/walletConnectActions'
import { EdgeRow } from '../rows/EdgeRow'
import { EdgeCard } from './EdgeCard'

interface Props {
  actions: WcAction[]
  wallet: EdgeCurrencyWallet
  walletAddress?: string
}

/**
 * Lists what a WalletConnect request asks the wallet to sign or do.
 */
export const WcActionsCard: React.FC<Props> = props => {
  const { actions, wallet, walletAddress } = props

  return (
    <EdgeCard sections>
      {actions.map((action, index) => {
        const { title, body, isRisky } = describeWcAction(action, {
          currencyConfig: wallet.currencyConfig,
          walletAddress
        })
        return (
          <EdgeRow
            key={index}
            title={title}
            body={body}
            error={isRisky}
            maximumHeight="large"
          />
        )
      })}
    </EdgeCard>
  )
}
