import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { lstrings } from '../../locales/strings'
import {
  describeWcAction,
  describeWcAssetChange,
  type WcSimulation
} from '../../util/walletConnectActions'
import { EdgeRow } from '../rows/EdgeRow'
import { AlertCardUi4 } from './AlertCard'
import { EdgeCard } from './EdgeCard'

interface Props {
  simulation: WcSimulation | 'loading' | 'unavailable'
  wallet: EdgeCurrencyWallet
  walletAddress?: string
}

/**
 * Shows what the network says a WalletConnect transaction would do.
 */
export const WcSimulationCard: React.FC<Props> = props => {
  const { simulation, wallet, walletAddress } = props
  const opts = { currencyConfig: wallet.currencyConfig, walletAddress }

  if (simulation === 'loading') {
    return (
      <EdgeCard>
        <EdgeRow title={lstrings.wc_sim_title} loading />
      </EdgeCard>
    )
  }
  if (simulation === 'unavailable') {
    return (
      <EdgeCard>
        <EdgeRow
          title={lstrings.wc_sim_title}
          body={lstrings.wc_sim_unavailable}
        />
      </EdgeCard>
    )
  }
  if (!simulation.success) {
    return (
      <AlertCardUi4
        title={lstrings.wc_sim_fail_title}
        body={simulation.error}
        type="error"
        marginRem={0.5}
      />
    )
  }

  const { approvals, assetChanges } = simulation
  const summary =
    assetChanges == null
      ? lstrings.wc_sim_no_details
      : assetChanges.length === 0 && approvals.length === 0
      ? lstrings.wc_sim_no_change
      : lstrings.wc_sim_success
  return (
    <EdgeCard sections>
      <EdgeRow
        title={lstrings.wc_sim_title}
        body={summary}
        maximumHeight="large"
      />
      {(assetChanges ?? []).map((change, index) => {
        const { title, body } = describeWcAssetChange(change, opts)
        return (
          <EdgeRow
            key={`change${index}`}
            title={title}
            body={body}
            maximumHeight="large"
          />
        )
      })}
      {approvals.map((approval, index) => {
        const { title, body, isRisky } = describeWcAction(approval, opts)
        return (
          <EdgeRow
            key={`approval${index}`}
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
