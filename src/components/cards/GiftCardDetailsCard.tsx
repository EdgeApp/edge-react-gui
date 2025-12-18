import type { EdgeTxActionGiftCard } from 'edge-core-js'
import * as React from 'react'
import { Linking } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { removeIsoPrefix } from '../../util/utils'
import { CircularBrandIcon } from '../common/CircularBrandIcon'
import { EdgeRow } from '../rows/EdgeRow'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  action: EdgeTxActionGiftCard
}

/**
 * Displays gift card details including brand, amount, and redemption code
 * in TransactionDetailsScene for gift card purchases.
 */
export const GiftCardDetailsCard: React.FC<Props> = ({ action }) => {
  const { card, redemption } = action

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

  return (
    <EdgeCard sections>
      <EdgeRow icon={brandIcon} title={lstrings.gift_card_label}>
        <EdgeText>{card.name}</EdgeText>
      </EdgeRow>

      <EdgeRow title={lstrings.string_amount} body={amountDisplay} />

      {redemption?.code != null ? (
        <EdgeRow
          title={lstrings.gift_card_security_code}
          body={redemption.code}
          rightButtonType="copy"
        />
      ) : null}

      {redemption?.url != null ? (
        <EdgeRow
          title={lstrings.gift_card_redeem}
          body={lstrings.gift_card_redeem_visit}
          rightButtonType="touchable"
          onPress={handleRedeemPress}
        />
      ) : null}
    </EdgeCard>
  )
}
