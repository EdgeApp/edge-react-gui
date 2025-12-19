import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { PhazeDisplayOrder } from '../../plugins/gift-cards/phazeGiftCardTypes'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import {
  ChevronRightIcon,
  CopyIcon,
  DotsThreeVerticalIcon
} from '../icons/ThemedIcons'
import { Shimmer } from '../progress-indicators/Shimmer'
import { showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

// Zoom factor to crop out edge artifacts from source images. One size fits most
// - differs per source image, but better than nothing.
const ZOOM_FACTOR = 1.025

/**
 * Card display states:
 * - pending: Order broadcasted but voucher not yet received
 * - available: Voucher received, ready to redeem
 * - redeemed: User has marked as redeemed
 */
export type GiftCardStatus = 'pending' | 'available' | 'redeemed'

interface Props {
  order: PhazeDisplayOrder
  /** Display state of the card */
  status: GiftCardStatus
  onMenuPress: () => void
  /** Called when user taps redeem and completes viewing (webview closes) */
  onRedeemComplete?: () => void
}

/**
 * Displays a gift card in a physical card-like format (1.6:1 aspect ratio).
 * Shows brand image as background with amount, brand name, security code,
 * and redemption link overlaid.
 */
export const GiftCardDisplayCard: React.FC<Props> = props => {
  const { order, status, onMenuPress, onRedeemComplete } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const code = order.vouchers?.[0]?.code
  const redemptionUrl = order.vouchers?.[0]?.url

  // Redeemed cards are dimmed; pending cards use shimmer overlay instead
  const cardContainerStyle =
    status === 'redeemed'
      ? [styles.cardContainer, styles.dimmedCard]
      : styles.cardContainer

  // Format amount with fiat symbol
  const fiatSymbol = getFiatSymbol(order.fiatCurrency)
  const formattedAmount = `${fiatSymbol} ${order.fiatAmount}`

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
    if (onRedeemComplete != null) {
      onRedeemComplete()
    }
  })

  return (
    <View style={cardContainerStyle}>
      {/* Brand image background */}
      <FastImage
        source={{ uri: order.brandImage }}
        style={styles.cardImage}
        resizeMode={FastImage.resizeMode.cover}
      />

      {/* Content overlay */}
      <View style={styles.cardOverlay}>
        {/* Top row: Amount + Brand name (left) + Menu icon (right) */}
        <View style={styles.topRow1}>
          <EdgeText style={styles.amountText}>{formattedAmount}</EdgeText>
          <EdgeTouchableOpacity onPress={onMenuPress}>
            <DotsThreeVerticalIcon
              size={theme.rem(1)}
              color={theme.iconTappable}
              style={styles.embossedShadow}
            />
          </EdgeTouchableOpacity>
        </View>
        <View style={styles.topRow2}>
          <EdgeText style={styles.brandNameText} numberOfLines={1}>
            {order.brandName}
          </EdgeText>
        </View>

        {/* Spacer for center area */}
        <View style={styles.centerRow} />

        {/* Bottom row: Security code (left) + Redeem/Pending (right) */}
        <View style={styles.bottomRow}>
          {code != null ? (
            <EdgeTouchableOpacity
              onPress={handleCopyCode}
              style={styles.codeContainer}
            >
              <EdgeText style={styles.codeValue}>{code}</EdgeText>
              <CopyIcon
                size={theme.rem(0.875)}
                color={theme.iconTappable}
                style={styles.embossedShadow}
              />
            </EdgeTouchableOpacity>
          ) : (
            <View />
          )}

          {status === 'pending' ? (
            <EdgeText style={styles.pendingText}>
              {lstrings.fragment_wallet_unconfirmed}
            </EdgeText>
          ) : status === 'available' && redemptionUrl != null ? (
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
                style={styles.embossedShadow}
              />
            </EdgeTouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Shimmer overlay for pending state */}
      <Shimmer isShown={status === 'pending'} />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    aspectRatio: 1.6,
    borderRadius: theme.cardBorderRadius,
    overflow: 'hidden',
    position: 'relative'
  },
  dimmedCard: {
    opacity: 0.5
  },
  cardImage: {
    position: 'absolute',
    // Slightly larger than container to crop edge artifacts
    width: `${ZOOM_FACTOR * 100}%`,
    height: `${ZOOM_FACTOR * 100}%`,
    // Center the oversized image
    left: `${((1 - ZOOM_FACTOR) / 2) * 100}%`,
    top: `${((1 - ZOOM_FACTOR) / 2) * 100}%`
  },
  cardOverlay: {
    flex: 1,
    padding: theme.rem(0.75),
    justifyContent: 'space-between'
  },
  // Top row
  topRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  topRow2: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  amountText: {
    fontSize: theme.rem(1.25),
    fontFamily: theme.fontFaceBold,
    ...theme.embossedTextShadow
  },
  brandNameText: {
    fontSize: theme.rem(1),
    ...theme.embossedTextShadow
  },
  embossedShadow: theme.embossedTextShadow,
  // Center row (spacer)
  centerRow: {
    flex: 1
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
  codeValue: {
    fontSize: theme.rem(0.875),
    fontFamily: theme.fontFaceMedium,
    marginRight: theme.rem(0.5),
    ...theme.embossedTextShadow
  },
  redeemContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  redeemText: {
    color: theme.iconTappable,
    fontSize: theme.rem(0.875),
    fontFamily: theme.fontFaceMedium,
    ...theme.embossedTextShadow
  },
  pendingText: {
    color: theme.deactivatedText,
    fontSize: theme.rem(0.875),
    fontFamily: theme.fontFaceMedium,
    ...theme.embossedTextShadow
  }
}))
