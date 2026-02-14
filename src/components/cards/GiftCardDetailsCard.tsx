import Clipboard from '@react-native-clipboard/clipboard'
import type { EdgeTxActionGiftCard } from 'edge-core-js'
import * as React from 'react'
import { Linking, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { triggerHaptic } from '../../util/haptic'
import { removeIsoPrefix } from '../../util/utils'
import { CircularBrandIcon } from '../common/CircularBrandIcon'
import { DividerLineUi4 } from '../common/DividerLineUi4'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { CopyIcon } from '../icons/ThemedIcons'
import { EdgeRow } from '../rows/EdgeRow'
import { showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  action: EdgeTxActionGiftCard
}

/**
 * Displays gift card details including brand, amount, quote ID, and redemption
 * code in TransactionDetailsScene for gift card purchases.
 *
 * Layout: A left column of data rows with dividers and a single card-level copy
 * button on the right. Dividers stop short of the copy button area.
 */
export const GiftCardDetailsCard: React.FC<Props> = ({ action }) => {
  const { card, redemption } = action
  const theme = useTheme()
  const styles = getStyles(theme)

  // Backward compat: Prior versions stored the quoteId in the orderId field.
  // Detect legacy transactions by checking whether the explicit quoteId field
  // is populated. If missing, fall back to orderId which held the quoteId.
  const quoteId = action.quoteId ?? action.orderId
  const productId = action.productId
  // orderId is only meaningful when quoteId is separately populated (new format)
  const orderId = action.quoteId != null ? action.orderId : undefined

  const handleRedeemPress = useHandler(() => {
    if (redemption?.url != null) {
      Linking.openURL(redemption.url).catch(() => {})
    }
  })

  const brandIcon = React.useMemo(
    () =>
      card.imageUrl != null && card.imageUrl !== '' ? (
        <CircularBrandIcon
          imageUrl={card.imageUrl}
          sizeRem={2}
          marginRem={[0, 0.5, 0, 0]}
        />
      ) : null,
    [card.imageUrl]
  )

  // Format fiat amount with currency
  const fiatCurrency = removeIsoPrefix(card.fiatCurrencyCode)
  const amountDisplay = `${card.fiatAmount} ${fiatCurrency}`

  // Build formatted string for card-level copy
  const copyText = React.useMemo(() => {
    const lines = [
      `${lstrings.gift_card_label}: ${card.name}`,
      `${lstrings.string_amount}: ${amountDisplay}`,
      `${lstrings.gift_card_quote_id_label}: ${quoteId}`
    ]
    if (productId != null) {
      lines.push(`${lstrings.gift_card_product_id_label}: ${productId}`)
    }
    if (orderId != null) {
      lines.push(`${lstrings.gift_card_order_id_label}: ${orderId}`)
    }
    if (redemption?.code != null) {
      lines.push(`${lstrings.gift_card_security_code}: ${redemption.code}`)
    }
    return lines.join('\n')
  }, [card.name, amountDisplay, quoteId, productId, orderId, redemption?.code])

  const handleCopyAll = useHandler(() => {
    triggerHaptic('impactLight')
    Clipboard.setString(copyText)
    showToast(lstrings.fragment_copied)
  })

  return (
    <EdgeCard>
      <View style={styles.cardLayout}>
        {/* Left column: data rows with dividers */}
        <View style={styles.dataColumn}>
          <EdgeRow icon={brandIcon} title={lstrings.gift_card_label}>
            <EdgeText>{card.name}</EdgeText>
          </EdgeRow>

          <DividerLineUi4 />

          <EdgeRow title={lstrings.string_amount} body={amountDisplay} />

          <DividerLineUi4 />

          <EdgeRow title={lstrings.gift_card_quote_id_label} body={quoteId} />

          {productId != null ? (
            <>
              <DividerLineUi4 />
              <EdgeRow
                title={lstrings.gift_card_product_id_label}
                body={productId}
              />
            </>
          ) : null}

          {orderId != null ? (
            <>
              <DividerLineUi4 />
              <EdgeRow
                title={lstrings.gift_card_order_id_label}
                body={orderId}
              />
            </>
          ) : null}

          {redemption?.code != null ? (
            <>
              <DividerLineUi4 />
              <EdgeRow
                title={lstrings.gift_card_security_code}
                body={redemption.code}
              />
            </>
          ) : null}
        </View>

        {/* Right column: card-level copy button */}
        <EdgeTouchableOpacity style={styles.copyColumn} onPress={handleCopyAll}>
          <CopyIcon size={theme.rem(1)} color={theme.iconTappable} />
        </EdgeTouchableOpacity>
      </View>

      {/* Redeem row outside the copy layout - has its own chevron */}
      {redemption?.url != null ? (
        <>
          <DividerLineUi4 />
          <EdgeRow
            title={lstrings.gift_card_redeem}
            body={lstrings.gift_card_redeem_visit}
            rightButtonType="touchable"
            onPress={handleRedeemPress}
          />
        </>
      ) : null}
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardLayout: {
    flexDirection: 'row' as const
  },
  dataColumn: {
    flex: 1,
    flexDirection: 'column' as const
  },
  copyColumn: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.rem(0.75)
  }
}))
