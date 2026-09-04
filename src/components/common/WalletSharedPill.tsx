import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { WalletShareHistoryModal } from '../modals/WalletShareHistoryModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeTouchableOpacity } from './EdgeTouchableOpacity'

interface Props {
  wallet: EdgeCurrencyWallet
}

/**
 * Marks a wallet that has been shared, either direction. Tapping it opens the
 * full history.
 *
 * Renders nothing when the wallet has never been shared, so the balance card
 * is unchanged for the wallets that is true of.
 */
export const WalletSharedPill: React.FC<Props> = props => {
  const { wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const sharingState = wallet.sharingState
  const isShared =
    sharingState != null &&
    (sharingState.sharedWith.length > 0 || sharingState.sharedFrom.length > 0)

  const handlePress = useHandler(() => {
    if (sharingState == null) return
    Airship.show(bridge => (
      <WalletShareHistoryModal bridge={bridge} sharingState={sharingState} />
    )).catch(() => {
      // The modal only reads state; nothing to recover from.
    })
  })

  if (!isShared) return null

  return (
    <EdgeTouchableOpacity
      accessibilityHint={lstrings.wallet_share_history_title}
      onPress={handlePress}
      testID="walletSharedPill"
    >
      <View style={styles.pill}>
        <EdgeText style={styles.text}>{lstrings.wallet_share_pill}</EdgeText>
      </View>
    </EdgeTouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  pill: {
    // The warning card's amber, as a solid fill:
    backgroundColor: theme.warningText,
    borderRadius: theme.rem(0.5),
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: theme.rem(0.125)
  },
  text: {
    // Deliberately smaller than the wallet name and the currency icon: this
    // is a footnote on the card, not a heading.
    fontSize: theme.rem(0.6),
    fontFamily: theme.fontFaceMedium,
    color: theme.badgeText
  }
}))
