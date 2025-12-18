import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { PhazeDisplayOrder } from '../../plugins/gift-cards/phazeGiftCardTypes'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { ChevronRightIcon, DotsThreeVerticalIcon } from '../icons/ThemedIcons'
import { showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  order: PhazeDisplayOrder
  onMenuPress?: () => void
  /** Called when user taps redeem and completes viewing (webview closes) */
  onRedeemComplete?: () => void
}

/**
 * Displays a gift card in a physical card-like format (1.6:1 aspect ratio).
 * Shows brand image as background with amount, brand name, security code,
 * and redemption link overlaid.
 */
export const GiftCardDisplayCard: React.FC<Props> = props => {
  const { order, onMenuPress, onRedeemComplete } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const code = order.vouchers?.[0]?.code
  const redemptionUrl = order.vouchers?.[0]?.url

  // Copy security code to clipboard
  const handleCopyCode = useHandler(() => {
    if (code != null) {
      Clipboard.setString(code)
      showToast(lstrings.gift_card_code_copied)
    }
  })

  // Copy code and trigger redemption flow
  const handleRedeem = useHandler(() => {
    if (code != null) {
      Clipboard.setString(code)
      showToast(lstrings.gift_card_code_copied)
    }

    // Notify parent to handle redemption (open webview, then prompt)
    onRedeemComplete?.()
  })

  return (
    <View style={styles.cardContainer}>
      {/* Brand image background */}
      <FastImage
        source={{ uri: order.brandImage }}
        style={styles.cardImage}
        resizeMode={FastImage.resizeMode.cover}
      />

      {/* Content overlay */}
      <View style={styles.cardOverlay}>
        {/* Top row: Amount (left) + Menu icon (right) */}
        <View style={styles.topRow}>
          <EdgeText style={styles.amountText}>
            {order.fiatAmount} {order.fiatCurrency}
          </EdgeText>
          {onMenuPress != null ? (
            <EdgeTouchableOpacity onPress={onMenuPress}>
              <DotsThreeVerticalIcon
                size={theme.rem(1.5)}
                color={theme.iconTappable}
                style={styles.iconShadow}
              />
            </EdgeTouchableOpacity>
          ) : null}
        </View>

        {/* Center: Brand name */}
        <View style={styles.centerRow}>
          <EdgeText style={styles.brandNameText} numberOfLines={2}>
            {order.brandName}
          </EdgeText>
        </View>

        {/* Bottom row: Security code (left) + Redeem (right) */}
        <View style={styles.bottomRow}>
          {code != null ? (
            <EdgeTouchableOpacity
              onPress={handleCopyCode}
              style={styles.codeContainer}
            >
              <EdgeText style={styles.codeLabel}>
                {`${lstrings.gift_card_security_code}: `}
              </EdgeText>
              <EdgeText style={styles.codeValue}>
                {lstrings.redacted_placeholder}
              </EdgeText>
            </EdgeTouchableOpacity>
          ) : (
            <View />
          )}

          {redemptionUrl != null ? (
            <EdgeTouchableOpacity
              onPress={handleRedeem}
              style={styles.redeemContainer}
            >
              <EdgeText style={styles.redeemText}>
                {lstrings.gift_card_redeem}
              </EdgeText>
              <ChevronRightIcon
                size={theme.rem(1)}
                color={theme.iconTappable}
                style={styles.iconShadow}
              />
            </EdgeTouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  )
}

// Darker text shadow for raised/embossed effect on gift card
const giftCardTextShadow = {
  textShadowColor: 'rgba(0, 0, 0, 0.8)',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 3
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    aspectRatio: 1.6,
    borderRadius: theme.cardBorderRadius,
    overflow: 'hidden',
    position: 'relative'
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject
  },
  cardOverlay: {
    flex: 1,
    padding: theme.rem(0.75),
    justifyContent: 'space-between'
  },
  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  amountText: {
    fontSize: theme.rem(1.25),
    fontFamily: theme.fontFaceBold,
    ...giftCardTextShadow
  },
  iconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },
  // Center row
  centerRow: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandNameText: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceBold,
    textAlign: 'center',
    ...giftCardTextShadow
  },
  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  codeLabel: {
    fontSize: theme.rem(0.75),
    marginRight: theme.rem(0.25),
    ...giftCardTextShadow
  },
  codeValue: {
    fontSize: theme.rem(0.875),
    fontFamily: theme.fontFaceMedium,
    ...giftCardTextShadow
  },
  redeemContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  redeemText: {
    color: theme.iconTappable,
    fontSize: theme.rem(0.875),
    fontFamily: theme.fontFaceMedium,
    ...giftCardTextShadow
  }
}))
