import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

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

// The warning card's gradient runs corner to corner, which on something this
// short and wide fades the far end into the card. Run it along the pill
// instead, in the same colors:
const GRADIENT_START = { x: 0, y: 0 }
const GRADIENT_END = { x: 1, y: 0 }

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
      style={styles.touchable}
      onPress={handlePress}
      testID="walletSharedPill"
    >
      <View style={styles.pill}>
        <LinearGradient
          colors={theme.cardGradientWarning.colors}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={StyleSheet.absoluteFill}
        />
        <EdgeText disableFontScaling style={styles.text}>
          {lstrings.wallet_share_pill}
        </EdgeText>
      </View>
    </EdgeTouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  touchable: {
    // The amount beside this gives up the width instead, so the label always
    // has room to render in full:
    flexShrink: 0,
    marginLeft: theme.rem(0.5)
  },
  pill: {
    // The label sizes the pill and the gradient fills in behind it, the way
    // EdgeCard layers its own background. Sizing the gradient view itself
    // leaves it too narrow on iOS and clips the label:
    borderRadius: theme.rem(0.5),
    overflow: 'hidden',
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: theme.rem(0.125)
  },
  text: {
    // Deliberately smaller than the wallet name and the currency icon: this
    // is a footnote on the card, not a heading.
    fontSize: theme.rem(0.6),
    fontFamily: theme.fontFaceMedium
  }
}))
