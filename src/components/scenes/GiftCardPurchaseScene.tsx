import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { PhazeGiftCardBrand } from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { FilledTextInput } from '../themed/FilledTextInput'
import {
  GiftCardAmountModal,
  type GiftCardAmountResult
} from '../modals/GiftCardAmountModal'
import {
  WalletListModal,
  type WalletListResult
} from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface GiftCardPurchaseParams {
  brand: PhazeGiftCardBrand
}

interface Props extends EdgeAppSceneProps<'giftCardPurchase'> {}

export const GiftCardPurchaseScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const { brand } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)

  // Determine if this is fixed denominations or variable range
  const sortedDenominations = React.useMemo(
    () => [...brand.denominations].sort((a, b) => a - b),
    [brand.denominations]
  )
  const hasFixedDenominations = sortedDenominations.length > 0

  // For variable range, get min/max from valueRestrictions
  const minVal = brand.valueRestrictions?.minVal ?? 0
  const maxVal = brand.valueRestrictions?.maxVal ?? 0
  const hasVariableRange = !hasFixedDenominations && maxVal > 0

  // Amount state - for fixed denoms, default to minimum; for variable, start empty
  const [selectedAmount, setSelectedAmount] = React.useState<number | null>(
    hasFixedDenominations ? sortedDenominations[0] : null
  )
  const [amountText, setAmountText] = React.useState<string>(
    hasFixedDenominations ? String(sortedDenominations[0]) : ''
  )

  // Handle amount text change for variable range
  const handleAmountChange = useHandler((text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '')
    setAmountText(cleaned)

    const parsed = parseFloat(cleaned)
    if (!isNaN(parsed) && parsed >= minVal && parsed <= maxVal) {
      setSelectedAmount(parsed)
    } else if (cleaned === '') {
      setSelectedAmount(null)
    }
  })

  // Handle MAX button press
  const handleMaxPress = useHandler(() => {
    if (hasVariableRange) {
      setAmountText(String(maxVal))
      setSelectedAmount(maxVal)
    }
  })

  // Handle amount row press for fixed denominations
  const handleAmountPress = useHandler(async () => {
    if (!hasFixedDenominations) {
      return
    }

    const result = await Airship.show<GiftCardAmountResult | undefined>(
      bridge => (
        <GiftCardAmountModal
          bridge={bridge}
          brandName={brand.brandName}
          productImage={brand.productImage}
          currency={brand.currency}
          denominations={brand.denominations}
        />
      )
    )

    if (result != null) {
      setSelectedAmount(result.amount)
      setAmountText(String(result.amount))
    }
  })

  const handleNextPress = useHandler(async () => {
    if (selectedAmount == null) {
      return
    }

    // Show wallet selection modal
    const walletResult = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        headerTitle={lstrings.gift_card_pay_from_wallet}
        navigation={navigation as NavigationBase}
        showCreateWallet
      />
    ))

    if (walletResult?.type !== 'wallet') {
      return
    }

    const { walletId, tokenId } = walletResult
    const wallet = account.currencyWallets[walletId]

    if (wallet == null) {
      showError(new Error('Wallet not found'))
      return
    }

    // TODO: Create quote with Phaze API and get payment address
    // For now, navigate to send scene with placeholder
    // The actual implementation will:
    // 1. Call Phaze API to create order quote
    // 2. Get the crypto payment address
    // 3. Navigate to SendScene2 with proper spendInfo
    // 4. After broadcast, save order to disklet

    console.log('[Phaze] Purchase:', {
      brandName: brand.brandName,
      productId: brand.productId,
      amount: selectedAmount,
      currency: brand.currency,
      walletId,
      tokenId
    })

    // TODO: Implement full flow with Phaze quote API
    showError(new Error('Purchase flow not yet implemented'))
  })

  // Validation for variable range
  const isAmountValid =
    selectedAmount != null &&
    (hasFixedDenominations ||
      (selectedAmount >= minVal && selectedAmount <= maxVal))

  // Section title based on type
  const sectionTitle = hasFixedDenominations
    ? lstrings.gift_card_select_amount
    : lstrings.gift_card_enter_amount

  return (
    <SceneWrapper scroll>
      {({ insetStyle }) => (
        <View style={[styles.container, { paddingBottom: insetStyle.paddingBottom }]}>
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 60 }}>
            <EdgeCard>
              <View style={styles.brandImageContainer}>
                <FastImage
                  source={{ uri: brand.productImage }}
                  style={styles.brandImage}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>
            </EdgeCard>
          </EdgeAnim>

          <EdgeAnim enter={{ type: 'fadeInUp', distance: 40 }}>
            <SectionHeader leftTitle={sectionTitle} />

            {hasFixedDenominations ? (
              // Fixed denominations - tappable row that opens modal
              <EdgeTouchableOpacity
                style={styles.fixedAmountRow}
                onPress={handleAmountPress}
              >
                <EdgeText style={styles.inputLabel}>
                  {lstrings.string_amount} {brand.currency}
                </EdgeText>
                <EdgeText style={styles.amountValue}>
                  {selectedAmount ?? '—'}
                </EdgeText>
              </EdgeTouchableOpacity>
            ) : (
              // Variable range - editable text input
              <View style={styles.variableAmountContainer}>
                <View style={styles.inputContainer}>
                  <EdgeText style={styles.inputLabel}>
                    {lstrings.string_amount} {brand.currency}
                  </EdgeText>
                  <FilledTextInput
                    value={amountText}
                    onChangeText={handleAmountChange}
                    keyboardType="decimal-pad"
                    placeholder={`${minVal} - ${maxVal}`}
                    clearIcon
                    textsizeRem={1.5}
                  />
                </View>
                <EdgeTouchableOpacity
                  style={styles.maxButton}
                  onPress={handleMaxPress}
                >
                  <EdgeText style={styles.maxButtonText}>
                    {lstrings.string_max_cap}
                  </EdgeText>
                </EdgeTouchableOpacity>
              </View>
            )}
          </EdgeAnim>

          <View style={styles.buttonContainer}>
            <SceneButtons
              primary={{
                label: lstrings.string_next_capitalized,
                onPress: handleNextPress,
                disabled: !isAmountValid
              }}
            />
          </View>
        </View>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    padding: theme.rem(0.5)
  },
  brandImageContainer: {
    aspectRatio: 1.6,
    width: '100%',
    borderRadius: theme.cardBorderRadius,
    overflow: 'hidden'
  },
  brandImage: {
    ...StyleSheet.absoluteFillObject
  },
  // Input label (shared between fixed and variable)
  inputLabel: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    marginBottom: theme.rem(0.25)
  },
  inputContainer: {
    backgroundColor: theme.textInputBackgroundColor,
    borderRadius: theme.rem(0.5),
    paddingVertical: theme.rem(0.75),
    paddingHorizontal: theme.rem(1)
  },
  // Fixed denomination row
  fixedAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.textInputBackgroundColor,
    borderRadius: theme.rem(0.5),
    paddingVertical: theme.rem(1),
    paddingHorizontal: theme.rem(1),
    marginTop: theme.rem(0.5)
  },
  amountValue: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceMedium
  },
  // Variable amount input
  variableAmountContainer: {
    marginTop: theme.rem(0.5)
  },
  maxButton: {
    alignSelf: 'flex-end',
    marginTop: theme.rem(0.5),
    paddingVertical: theme.rem(0.25),
    paddingHorizontal: theme.rem(0.5)
  },
  maxButtonText: {
    color: theme.iconTappable,
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceMedium
  },
  buttonContainer: {
    marginTop: theme.rem(1)
  }
}))

