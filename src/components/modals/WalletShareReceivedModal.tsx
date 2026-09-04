import type { EdgeCurrencyWallet, EdgeWalletShareMode } from 'edge-core-js'
import * as React from 'react'
import type { AirshipBridge } from 'react-native-airship'
import { ScrollView } from 'react-native-gesture-handler'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { ModalButtons } from '../buttons/ModalButtons'
import { WalletShareSummaryRow } from '../rows/WalletShareSummaryRow'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SharePartyText } from '../text/SharePartyText'
import { ModalTitle } from '../themed/ModalParts'
import { EdgeModal } from './EdgeModal'

export interface ReceivedWalletEntry {
  wallet: EdgeCurrencyWallet
  mode: EdgeWalletShareMode
}

interface Props {
  bridge: AirshipBridge<void>
  entries: ReceivedWalletEntry[]
  /** Who sent them, '' when they gave no name. */
  counterpartyName: string
}

/**
 * Tells the receiver what just landed in their account and with what access.
 * Balances are left out on purpose: the wallets have not synced yet, and a
 * row of zeros would read as "empty" rather than "loading".
 */
export const WalletShareReceivedModal: React.FC<Props> = props => {
  const { bridge, entries, counterpartyName } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleClose = useHandler(() => {
    bridge.resolve()
  })

  return (
    <EdgeModal
      bridge={bridge}
      title={
        <ModalTitle>
          <SharePartyText
            template={lstrings.wallet_share_received_title_1s}
            name={counterpartyName}
            fallbackTemplate={lstrings.wallet_share_received_title}
          />
        </ModalTitle>
      }
      onCancel={handleClose}
    >
      <ScrollView
        style={styles.list}
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      >
        {entries.map((entry, index) => (
          <WalletShareSummaryRow
            key={entry.wallet.id}
            wallet={entry.wallet}
            mode={entry.mode}
            isLast={index === entries.length - 1}
          />
        ))}
      </ScrollView>
      <ModalButtons
        primary={{ label: lstrings.string_ok, onPress: handleClose }}
      />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    flexGrow: 0,
    flexShrink: 1
  }
}))
