import * as React from 'react'
import { FlatList, type ListRenderItem, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { CircularBrandIcon } from '../common/CircularBrandIcon'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SectionHeader } from '../common/SectionHeader'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeModal } from './EdgeModal'

export interface GiftCardAmountItem {
  brandName: string
  productImage: string
  amount: number
  currency: string
  isMinimum?: boolean
  isMaximum?: boolean
}

export interface GiftCardAmountResult {
  amount: number
  currency: string
}

interface Props {
  bridge: AirshipBridge<GiftCardAmountResult | undefined>
  brandName: string
  productImage: string
  currency: string
  denominations: number[]
  selectedAmount?: number
}

export function GiftCardAmountModal(props: Props): React.ReactElement {
  const {
    bridge,
    brandName,
    productImage,
    currency,
    denominations,
    selectedAmount = denominations[0]
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // Sort denominations and prepare items
  const sortedDenominations = React.useMemo(
    () => [...denominations].sort((a, b) => a - b),
    [denominations]
  )

  const minAmount = sortedDenominations[0]
  const maxAmount = sortedDenominations[sortedDenominations.length - 1]

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  const handleAmountSelect = useHandler((amount: number) => {
    bridge.resolve({ amount, currency })
  })

  const handleConfirm = useHandler(() => {
    bridge.resolve({ amount: selectedAmount, currency })
  })

  // Build list items for fixed amounts section (excluding selected amount)
  const fixedAmountItems: GiftCardAmountItem[] = React.useMemo(
    () =>
      sortedDenominations
        .filter(amount => amount !== selectedAmount)
        .map(amount => ({
          brandName,
          productImage,
          amount,
          currency,
          isMinimum: amount === minAmount,
          isMaximum: amount === maxAmount
        })),
    [
      sortedDenominations,
      selectedAmount,
      brandName,
      productImage,
      currency,
      minAmount,
      maxAmount
    ]
  )

  const renderAmountRow: ListRenderItem<GiftCardAmountItem> = React.useCallback(
    ({ item }) => {
      const handlePress = (): void => {
        handleAmountSelect(item.amount)
      }

      // Determine label suffix
      let labelSuffix = ''
      if (item.isMinimum === true) {
        labelSuffix = 'Minimum'
      } else if (item.isMaximum === true) {
        labelSuffix = 'Maximum'
      }

      return (
        <EdgeTouchableOpacity style={styles.amountRow} onPress={handlePress}>
          <CircularBrandIcon imageUrl={item.productImage} />
          <View style={styles.amountTextContainer}>
            <EdgeText style={styles.amountBrandName} numberOfLines={1}>
              {item.brandName}
            </EdgeText>
            {labelSuffix !== '' ? (
              <EdgeText style={styles.amountLabel}>{labelSuffix}</EdgeText>
            ) : null}
          </View>
          <EdgeText style={styles.amountValue}>
            ${item.amount} {item.currency}
          </EdgeText>
        </EdgeTouchableOpacity>
      )
    },
    [handleAmountSelect, styles]
  )

  const keyExtractor = React.useCallback(
    (item: GiftCardAmountItem): string => String(item.amount),
    []
  )

  // Selected amount item for the top section
  const selectedItem: GiftCardAmountItem = {
    brandName,
    productImage,
    amount: selectedAmount,
    currency,
    isMinimum: selectedAmount === minAmount,
    isMaximum: selectedAmount === maxAmount
  }

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.gift_card_select_amount}
      onCancel={handleCancel}
    >
      <SectionHeader leftTitle={lstrings.gift_card_selected_amount} />
      <View style={styles.selectedContainer}>
        <EdgeTouchableOpacity style={styles.amountRow} onPress={handleConfirm}>
          <CircularBrandIcon imageUrl={productImage} />
          <View style={styles.amountTextContainer}>
            <EdgeText style={styles.amountBrandName} numberOfLines={1}>
              {brandName}
            </EdgeText>
            {selectedItem.isMinimum === true ? (
              <EdgeText style={styles.amountLabel}>Minimum</EdgeText>
            ) : selectedItem.isMaximum === true ? (
              <EdgeText style={styles.amountLabel}>Maximum</EdgeText>
            ) : null}
          </View>
          <EdgeText style={styles.amountValue}>
            ${selectedAmount} {currency}
          </EdgeText>
        </EdgeTouchableOpacity>
      </View>

      <SectionHeader leftTitle={lstrings.gift_card_fixed_amounts} />
      <FlatList
        data={fixedAmountItems}
        keyExtractor={keyExtractor}
        renderItem={renderAmountRow}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  selectedContainer: {
    marginBottom: theme.rem(0.5)
  },
  list: {
    flexGrow: 0,
    flexShrink: 1
  },
  listContent: {
    paddingBottom: theme.rem(1)
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.rem(0.5),
    marginTop: theme.rem(0.5),
    marginLeft: theme.rem(1),
    backgroundColor: theme.tileBackground,
    borderRadius: theme.rem(0.5)
  },
  amountTextContainer: {
    flex: 1,
    marginLeft: theme.rem(0.75)
  },
  amountBrandName: {
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  amountLabel: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  amountValue: {
    fontSize: theme.rem(1),
    color: theme.primaryText,
    marginLeft: theme.rem(0.5)
  }
}))
