import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import {
  useAccountSettings,
  writeLargeTxHistoryCardDismissed
} from '../../actions/LocalSettingsActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { logActivity } from '../../util/logger'
import { openBrowserUri } from '../../util/WebUtils'
import { showError } from '../services/AirshipInstance'
import { AlertCardUi4 } from './AlertCard'

interface Props {
  wallet: EdgeCurrencyWallet
}

const LARGE_UTXO_WALLET_HELP_URI =
  'https://support.edge.app/en/articles/17129745-what-does-the-large-wallet-card-mean'

/**
 * Explains the slow sync and the temporarily inflated balance of a UTXO wallet
 * with a long transaction history, which is what drives the "my balance is
 * wrong" and "insufficient funds" support tickets. The article behind the
 * Learn More button covers the manual resync those users end up needing.
 *
 * Uses the existing yellow `AlertCardUi4` warning treatment, matching the
 * sync-status card immediately above it, and the caller shows it only while
 * the wallet syncs.
 *
 * Closing the card hides it for good, for every wallet on the account. The
 * close is written to the activity log as proof the user saw the warning and
 * chose to dismiss it.
 */
export const LargeUtxoWalletCard: React.FC<Props> = props => {
  const { wallet } = props
  const account = useSelector(state => state.core.account)
  const { largeTxHistoryCardDismissed } = useAccountSettings()

  const handleLearnMore = useHandler(() => {
    const uri = config.largeUtxoWalletLearnMoreUrl ?? LARGE_UTXO_WALLET_HELP_URI
    openBrowserUri(uri).catch((error: unknown) => {
      showError(error)
    })
  })

  const handleClose = useHandler(() => {
    logActivity(
      `Large Tx History card closed: ${wallet.currencyInfo.pluginId} ${wallet.id}`
    )
    writeLargeTxHistoryCardDismissed(account).catch((error: unknown) => {
      showError(error)
    })
  })

  if (largeTxHistoryCardDismissed) return null
  return (
    <AlertCardUi4
      title={lstrings.large_utxo_wallet_title}
      type="warning"
      body={lstrings.large_utxo_wallet_body}
      button={{ label: lstrings.learn_more, onPress: handleLearnMore }}
      marginRem={[0.5, 0.5, 0, 0.5]}
      onClose={handleClose}
    />
  )
}
