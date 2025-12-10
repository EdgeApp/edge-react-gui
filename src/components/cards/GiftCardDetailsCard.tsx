import * as React from 'react'
import FastImage from 'react-native-fast-image'

import { lstrings } from '../../locales/strings'
import type { PhazeStoredOrder } from '../../plugins/gift-cards/phazeGiftCardTypes'
import { EdgeRow } from '../rows/EdgeRow'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  order: PhazeStoredOrder
}

/**
 * Displays gift card details including brand, amount, and redemption code
 * in TransactionDetailsScene for gift card purchases.
 */
export const GiftCardDetailsCard: React.FC<Props> = ({ order }) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const brandIcon = React.useMemo(
    () =>
      order.brandImage !== '' ? (
        <FastImage
          source={{ uri: order.brandImage }}
          style={styles.brandIcon}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : null,
    [order.brandImage, styles.brandIcon]
  )

  return (
    <EdgeCard sections>
      <EdgeRow
        icon={brandIcon}
        title={lstrings.gift_card_label}
        rightButtonType="editable"
      >
        <EdgeText>{order.brandName}</EdgeText>
      </EdgeRow>

      {order.redemptionCode != null ? (
        <EdgeRow
          title={lstrings.gift_card_redemption_code}
          rightButtonType="copy"
        >
          <EdgeText style={styles.redemptionCode}>
            {order.redemptionCode}
          </EdgeText>
        </EdgeRow>
      ) : null}
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  brandIcon: {
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(0.25),
    marginRight: theme.rem(0.5)
  },
  redemptionCode: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1)
  }
}))
