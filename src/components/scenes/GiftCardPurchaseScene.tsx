import type { EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import {
  type DimensionValue,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle
} from 'react-native'
import FastImage from 'react-native-fast-image'
import RenderHtml from 'react-native-render-html'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { v4 as uuidv4 } from 'uuid'

import { ENV } from '../../env'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type {
  PhazeGiftCardBrand,
  PhazeStoredOrder
} from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { edgeAssetToCaip19 } from '../../util/caip19Utils'
import { parseLinkedText } from '../../util/parseLinkedText'
import { DropdownInputButton } from '../buttons/DropdownInputButton'
import { KavButtons } from '../buttons/KavButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { SceneContainer } from '../layout/SceneContainer'
import {
  GiftCardAmountModal,
  type GiftCardAmountResult
} from '../modals/GiftCardAmountModal'
import {
  WalletListModal,
  type WalletListResult
} from '../modals/WalletListModal'
import { showHtmlModal } from '../modals/WebViewModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'

// Zoom factor to crop out edge artifacts from source images
const ZOOM_FACTOR = 1.03

// Style for the zoomed image container
const zoomedContainerStyle: ViewStyle = {
  position: 'absolute',
  width: `${ZOOM_FACTOR * 100}%` as DimensionValue,
  height: `${ZOOM_FACTOR * 100}%` as DimensionValue,
  top: `${((ZOOM_FACTOR - 1) / 2) * -100}%` as DimensionValue,
  left: `${((ZOOM_FACTOR - 1) / 2) * -100}%` as DimensionValue
}

export interface GiftCardPurchaseParams {
  brand: PhazeGiftCardBrand
}

interface Props extends EdgeAppSceneProps<'giftCardPurchase'> {}

export const GiftCardPurchaseScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const { brand } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)
  const { width: screenWidth } = useWindowDimensions()

  const account = useSelector(state => state.core.account)

  // Provider (requires API key configured)
  const apiKey = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)?.phaze as
    | { apiKey?: string }
    | undefined
  const phazeApiKey = apiKey?.apiKey ?? ''
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey: phazeApiKey
  })

  // State for loading indicator during order creation
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false)

  // Store pending order for onDone callback
  const pendingOrderRef = React.useRef<PhazeStoredOrder | null>(null)

  // State for collapsible cards
  const [howItWorksExpanded, setHowItWorksExpanded] = React.useState(false)
  const [termsExpanded, setTermsExpanded] = React.useState(false)

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
  const [selectedAmount, setSelectedAmount] = React.useState<
    number | undefined
  >(hasFixedDenominations ? sortedDenominations[0] : undefined)
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
      setSelectedAmount(undefined)
    }
  })

  // Handle MAX button press
  const handleMaxPress = useHandler(() => {
    if (hasVariableRange) {
      setAmountText(String(maxVal))
      setSelectedAmount(maxVal)
    }
  })

  // Toggle handlers for collapsible cards
  const handleHowItWorksToggle = useHandler(() => {
    setHowItWorksExpanded(!howItWorksExpanded)
  })

  const handleTermsToggle = useHandler(() => {
    setTermsExpanded(!termsExpanded)
  })

  // Open full terms and conditions in a modal
  const handleTermsLinkPress = useHandler(() => {
    if (brand.termsAndConditions == null) return
    showHtmlModal(
      lstrings.gift_card_terms_and_conditions,
      brand.termsAndConditions
    ).catch(() => {})
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
          selectedAmount={selectedAmount}
        />
      )
    )

    if (result != null) {
      setSelectedAmount(result.amount)
      setAmountText(String(result.amount))
    }
  })

  const handleNextPress = useHandler(async () => {
    if (selectedAmount == null || provider == null || !isReady) {
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

    // Get CAIP-19 identifier for the selected wallet/token
    const caip19 = edgeAssetToCaip19(account, {
      pluginId: wallet.currencyInfo.pluginId,
      tokenId
    })

    if (caip19 == null) {
      showError(new Error('Unsupported cryptocurrency for gift card purchase'))
      return
    }

    console.log('[Phaze] Creating order:', {
      brandName: brand.brandName,
      productId: brand.productId,
      amount: selectedAmount,
      currency: brand.currency,
      tokenIdentifier: caip19
    })

    setIsCreatingOrder(true)

    try {
      // Create order with Phaze API (includes brand info for display)
      const storedOrder = await provider.createOrder(
        account,
        {
          tokenIdentifier: caip19,
          cart: [
            {
              orderId: uuidv4(),
              price: selectedAmount,
              productId: brand.productId
            }
          ]
        },
        brand,
        selectedAmount
      )

      console.log('[Phaze] Order created:', {
        quoteId: storedOrder.quoteId,
        deliveryAddress: storedOrder.deliveryAddress,
        quantity: storedOrder.quantity,
        amountInUSD: storedOrder.amountInUSD,
        quoteExpiry: storedOrder.quoteExpiry
      })

      // Store the order for the onDone callback
      pendingOrderRef.current = storedOrder

      // Convert quantity to native amount (crypto amount to pay)
      // The quantity is in the token's standard units (e.g., BTC, ETH)
      const currencyCode =
        tokenId != null
          ? account.currencyConfig[wallet.currencyInfo.pluginId]?.allTokens[
              tokenId
            ]?.currencyCode ?? wallet.currencyInfo.currencyCode
          : wallet.currencyInfo.currencyCode

      const multiplier =
        tokenId != null
          ? account.currencyConfig[wallet.currencyInfo.pluginId]?.allTokens[
              tokenId
            ]?.denominations[0]?.multiplier ?? '1'
          : wallet.currencyInfo.denominations[0]?.multiplier ?? '1'

      // quantity from API is in decimal units, convert to native
      const nativeAmount = String(
        Math.ceil(storedOrder.quantity * parseFloat(multiplier))
      )

      // Calculate expiry time
      const expiryDate = new Date(storedOrder.quoteExpiry * 1000)
      const isoExpireDate = expiryDate.toISOString()

      // Navigate to SendScene2
      navigation.navigate('send2', {
        walletId,
        tokenId,
        spendInfo: {
          tokenId,
          spendTargets: [
            {
              publicAddress: storedOrder.deliveryAddress,
              nativeAmount
            }
          ],
          metadata: {
            name: `Gift Card: ${brand.brandName}`,
            // Store quoteId in notes for linking in TransactionDetailsScene
            notes: `Phaze gift card purchase - $${selectedAmount} ${brand.currency}\nQuoteId: ${storedOrder.quoteId}`
          }
        },
        lockTilesMap: {
          address: true,
          amount: true,
          wallet: true
        },
        hiddenFeaturesMap: {
          address: true,
          fioAddressSelect: true
        },
        infoTiles: [
          { label: lstrings.gift_card_brand, value: brand.brandName },
          {
            label: lstrings.string_amount,
            value: `$${selectedAmount} ${brand.currency}`
          },
          {
            label: lstrings.gift_card_pay_amount,
            value: `${storedOrder.quantity} ${currencyCode}`
          }
        ],
        sliderTopNode: (
          <Paragraph style={styles.sliderTermsText}>
            {parseLinkedText(
              lstrings.gift_card_slider_terms,
              handleTermsLinkPress,
              styles.termsLink
            )}
          </Paragraph>
        ),
        isoExpireDate,
        onDone: async (error: Error | null, tx?: EdgeTransaction) => {
          if (error != null) {
            console.log('[Phaze] Transaction error:', error)
            return
          }
          if (tx != null && pendingOrderRef.current != null) {
            console.log('[Phaze] Transaction successful:', tx.txid)

            // Save completed order with transaction details.
            // Order is only persisted AFTER successful broadcast.
            await provider.saveCompletedOrder(
              account,
              pendingOrderRef.current,
              walletId,
              tokenId,
              tx.txid
            )

            // Navigate to transaction details, then to gift card list on done
            navigation.replace('transactionDetails', {
              edgeTransaction: tx,
              walletId,
              onDone: () => {
                navigation.navigate('giftCardList')
              }
            })
          }
        }
      })
    } catch (err: unknown) {
      console.log('[Phaze] Order creation error:', err)
      showError(err)
    } finally {
      setIsCreatingOrder(false)
    }
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

  // Base style for RenderHtml (root font settings) to make it appear like
  // EdgeText
  const htmlBaseStyle = React.useMemo(
    () => ({
      color: theme.primaryText,
      fontSize: theme.rem(1),
      lineHeight: theme.rem(1.25),
      fontWeight: '300' as const
    }),
    [theme]
  )

  // Tag-specific overrides for RenderHtml
  const htmlTagsStyles = React.useMemo(
    () => ({
      p: {
        marginTop: 0,
        marginBottom: theme.rem(0.5)
      },
      a: {
        color: theme.iconTappable
      }
    }),
    [theme]
  )

  // Default text props to disable accessibility font scaling
  const defaultTextProps = React.useMemo(
    () => ({
      allowFontScaling: false
    }),
    []
  )

  // Content width for RenderHtml (accounting for card padding)
  const htmlContentWidth = screenWidth - theme.rem(3)

  return (
    <SceneWrapper
      dockProps={{
        keyboardVisibleOnly: false,
        children: (
          <KavButtons
            primary={{
              label: lstrings.string_next_capitalized,
              onPress: handleNextPress,
              disabled: !isAmountValid || isCreatingOrder,
              spinner: isCreatingOrder
            }}
          />
        )
      }}
      scroll
    >
      <SceneContainer>
        <EdgeAnim enter={{ type: 'fadeInUp', distance: 60 }}>
          <View style={styles.brandImageContainer}>
            <View style={zoomedContainerStyle}>
              <FastImage
                source={{ uri: brand.productImage }}
                style={StyleSheet.absoluteFill}
                resizeMode={FastImage.resizeMode.cover}
              />
            </View>
          </View>
        </EdgeAnim>

        <EdgeAnim enter={{ type: 'fadeInUp', distance: 40 }}>
          <SectionHeader leftTitle={sectionTitle} />

          {hasFixedDenominations ? (
            // Fixed denominations - tappable row that opens modal (if multiple options)
            <View style={styles.fixedAmountContainer}>
              <View style={styles.fixedAmountInner}>
                <DropdownInputButton
                  onPress={
                    sortedDenominations.length > 1
                      ? handleAmountPress
                      : undefined
                  }
                >
                  <View style={styles.fixedAmountContent}>
                    <EdgeText style={styles.inputLabel}>
                      {lstrings.string_value}
                    </EdgeText>
                    <EdgeText style={styles.amountValue}>
                      {selectedAmount != null
                        ? `${selectedAmount} ${brand.currency}`
                        : '—'}
                    </EdgeText>
                  </View>
                </DropdownInputButton>
                {sortedDenominations.length > 1 ? (
                  <EdgeTouchableOpacity
                    style={styles.maxButton}
                    onPress={() => {
                      const maxDenom =
                        sortedDenominations[sortedDenominations.length - 1]
                      setSelectedAmount(maxDenom)
                      setAmountText(String(maxDenom))
                    }}
                  >
                    <EdgeText style={styles.maxButtonText}>
                      {lstrings.string_max_cap}
                    </EdgeText>
                  </EdgeTouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : (
            // Variable range - editable text input
            <View style={styles.inputContainer}>
              <FilledTextInput
                value={amountText}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                placeholder={`${minVal} ${brand.currency} - ${maxVal} ${brand.currency}`}
                clearIcon
                textsizeRem={1.5}
              />
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

        {/* Product Description Card */}
        {brand.productDescription != null && brand.productDescription !== '' ? (
          <EdgeCard paddingRem={1}>
            <RenderHtml
              contentWidth={htmlContentWidth}
              source={{ html: brand.productDescription }}
              baseStyle={htmlBaseStyle}
              tagsStyles={htmlTagsStyles}
              defaultTextProps={defaultTextProps}
            />
          </EdgeCard>
        ) : null}

        {/* How it Works - Collapsible Card */}
        <EdgeCard>
          <EdgeTouchableOpacity
            style={styles.collapsibleHeader}
            onPress={handleHowItWorksToggle}
          >
            <EdgeText style={styles.collapsibleTitle}>
              {lstrings.gift_card_how_it_works}
            </EdgeText>
            <Ionicons
              name={howItWorksExpanded ? 'chevron-up' : 'chevron-down'}
              size={theme.rem(1.25)}
              color={theme.iconTappable}
            />
          </EdgeTouchableOpacity>
          {howItWorksExpanded ? (
            <Paragraph style={styles.collapsibleBody} numberOfLines={0}>
              {lstrings.gift_card_how_it_works_body}
            </Paragraph>
          ) : null}
        </EdgeCard>

        {/* Terms and Conditions - Collapsible Card */}
        <EdgeCard>
          <EdgeTouchableOpacity
            style={styles.collapsibleHeader}
            onPress={handleTermsToggle}
          >
            <EdgeText style={styles.collapsibleTitle}>
              {lstrings.gift_card_terms_and_conditions}
            </EdgeText>
            <Ionicons
              name={termsExpanded ? 'chevron-up' : 'chevron-down'}
              size={theme.rem(1.25)}
              color={theme.iconTappable}
            />
          </EdgeTouchableOpacity>
          {termsExpanded ? (
            <Paragraph style={styles.collapsibleBody} numberOfLines={0}>
              {parseLinkedText(
                lstrings.gift_card_terms_and_conditions_body,
                handleTermsLinkPress,
                styles.termsLink
              )}
            </Paragraph>
          ) : null}
        </EdgeCard>
      </SceneContainer>
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
    borderRadius: theme.cardBorderRadius,
    overflow: 'hidden',
    marginHorizontal: theme.rem(0.5)
  },
  // Input label (shared between fixed and variable)
  inputLabel: {
    fontSize: theme.rem(0.75),
    color: theme.textInputPlaceholderColor,
    marginBottom: theme.rem(0.25)
  },
  inputContainer: {
    paddingVertical: theme.rem(0.75),
    paddingHorizontal: theme.rem(2)
  },
  // Fixed denomination container
  fixedAmountContainer: {
    marginTop: theme.rem(0.5),
    alignItems: 'center'
  },
  fixedAmountInner: {
    alignItems: 'flex-end'
  },
  fixedAmountContent: {},
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
    marginVertical: theme.rem(0.5)
  },
  maxButtonText: {
    color: theme.iconTappable,
    fontFamily: theme.fontFaceMedium
  },
  // Collapsible card styles
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.rem(0.5)
  },
  collapsibleTitle: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceMedium
  },
  collapsibleBody: {
    marginTop: theme.rem(0.75),
    fontSize: theme.rem(0.75)
  },
  sliderTermsText: {
    textAlign: 'center',
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    marginBottom: theme.rem(0.5)
  },
  termsLink: {
    color: theme.iconTappable
  }
}))
