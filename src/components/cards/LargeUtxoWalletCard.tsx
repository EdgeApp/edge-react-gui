import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { openBrowserUri } from '../../util/WebUtils'
import { showError } from '../services/AirshipInstance'
import { AlertCardUi4 } from './AlertCard'

const LARGE_UTXO_WALLET_HELP_URI = 'https://support.edge.app/articles/13892386'

/**
 * Explains the slow sync and the temporarily inflated balance of a UTXO wallet
 * with a long transaction history, which is what drives the "my balance is
 * wrong" and "insufficient funds" support tickets. The article behind the
 * Learn More button covers the manual resync those users end up needing.
 *
 * Uses the existing yellow `AlertCardUi4` warning treatment, matching the
 * sync-status card immediately above it.
 *
 * Not dismissable, and not gated on the wallet currently syncing. A wallet in
 * this state can report itself fully synced while still showing stale balances
 * from unscanned distant addresses, which is exactly when the user is about to
 * try a send and be confused by the result.
 */
export const LargeUtxoWalletCard: React.FC = () => {
  const handleLearnMore = useHandler(() => {
    const uri = config.largeUtxoWalletLearnMoreUrl ?? LARGE_UTXO_WALLET_HELP_URI
    openBrowserUri(uri).catch((error: unknown) => {
      showError(error)
    })
  })

  return (
    <AlertCardUi4
      title={lstrings.large_utxo_wallet_title}
      type="warning"
      body={lstrings.large_utxo_wallet_body}
      button={{ label: lstrings.learn_more, onPress: handleLearnMore }}
    />
  )
}
