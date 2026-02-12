import { useQuery } from '@tanstack/react-query'
import { ceil, mul } from 'biggystring'
import type { EdgeTransaction, EdgeTxActionGiftCard } from 'edge-core-js'
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
import { sprintf } from 'sprintf-js'
import { v4 as uuidv4 } from 'uuid'

import { checkAndShowLightBackupModal } from '../../actions/BackupModalActions'
import { getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { displayFiatAmount } from '../../hooks/useFiatText'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { usePhazeBrand } from '../../hooks/usePhazeBrand'
import { lstrings } from '../../locales/strings'
import type {
  PhazeCreateOrderResponse,
  PhazeFxRate,
  PhazeGiftCardBrand,
  PhazeToken
} from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import type { EdgeAsset } from '../../types/types'
import { caip19ToEdgeAsset } from '../../util/caip19Utils'
import { debugLog } from '../../util/logger'
import { parseLinkedText } from '../../util/parseLinkedText'
import { DECIMAL_PRECISION } from '../../util/utils'
import { DropdownInputButton } from '../buttons/DropdownInputButton'
import { KavButtons } from '../buttons/KavButtons'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import { ErrorCard } from '../cards/ErrorCard'
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
import { ShimmerCard } from '../progress-indicators/ShimmerCard'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'

/** Create a consistent key for an EdgeAsset */
const assetKey = (asset: EdgeAsset): string =>
  `${asset.pluginId}:${asset.tokenId ?? 'native'}`

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
  const { brand: initialBrand } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)
  const { width: screenWidth } = useWindowDimensions()

  const account = useSelector(state => state.core.account)

  // Provider (requires API key configured)
  const phazeConfig = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)
    ?.phaze as { apiKey?: string; baseUrl?: string } | undefined
  const {
    provider,
    isReady,
    isError: isProviderError
  } = useGiftCardProvider({
    account,
    apiKey: phazeConfig?.apiKey ?? '',
    baseUrl: phazeConfig?.baseUrl ?? ''
  })

  // Fetch full brand details if needed (may have limited fields from market)
  const { brand } = usePhazeBrand(provider, initialBrand)

  // State for loading indicator during order creation
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false)

  // Store pending order for onDone callback
  const pendingOrderRef = React.useRef<PhazeCreateOrderResponse | null>(null)

  // State for collapsible cards
  const [howItWorksExpanded, setHowItWorksExpanded] = React.useState(false)
  const [termsExpanded, setTermsExpanded] = React.useState(false)

  // Token minimums map: assetKey -> PhazeToken (includes caip19, minimums)
  const tokenMinimumsRef = React.useRef<Map<string, PhazeToken>>(new Map())

  // Warning state for minimum amount violations
  const [minimumWarning, setMinimumWarning] = React.useState<{
    header: string
    footer: string
  } | null>(null)

  // Warning state for product unavailable
  const [productUnavailable, setProductUnavailable] =
    React.useState<boolean>(false)

  // Error state for unexpected errors
  const [error, setError] = React.useState<unknown>(null)

  // Fetch allowed tokens from Phaze API
  const { data: tokenQueryResult, refetch: refetchTokens } = useQuery({
    queryKey: ['phazeTokens', account?.id, isReady],
    queryFn: async () => {
      if (provider == null) {
        throw new Error('Provider not ready')
      }

      const tokensResponse = await provider.getTokens()

      // Convert CAIP-19 identifiers to EdgeAsset format and build token map
      // Key by asset (pluginId:tokenId) so we can look up the original caip19 later
      const assets: EdgeAsset[] = []
      const tokenMap = new Map<string, PhazeToken>()
      for (const token of tokensResponse.tokens) {
        const asset = caip19ToEdgeAsset(account, token.caip19)
        if (asset != null) {
          assets.push(asset)
          tokenMap.set(assetKey(asset), token)
        }
      }

      debugLog(
        'phaze',
        'Loaded',
        assets.length,
        'supported assets from',
        tokensResponse.tokens.length,
        'tokens'
      )
      return { assets, tokenMap }
    },
    enabled: isReady && provider != null,
    staleTime: 5 * 60 * 1000, // 5 minutes - tokens don't change often
    gcTime: 10 * 60 * 1000
  })

  // Get cached FX rates (already loaded during provider initialization)
  const fxRates = provider?.getCachedFxRates() ?? null

  /**
   * Convert USD amount to brand's currency using FX rates.
   * Returns formatted string like "€5" or "$5.00" for USD brands.
   */
  const formatMinimumInBrandCurrency = React.useCallback(
    (minimumUsd: number): string => {
      const symbol = getFiatSymbol(brand.currency)

      if (brand.currency === 'USD') {
        return `${symbol}${displayFiatAmount(minimumUsd, 2)}`
      }

      if (fxRates == null) {
        // Fallback to USD if rates not loaded
        return `$${displayFiatAmount(minimumUsd, 2)}`
      }

      const rate = fxRates.find(
        (r: PhazeFxRate) =>
          r.fromCurrency === 'USD' && r.toCurrency === brand.currency
      )
      if (rate == null) {
        // Fallback to USD if rate not found
        return `$${displayFiatAmount(minimumUsd, 2)}`
      }

      const amountInBrandCurrency = Math.ceil(minimumUsd * rate.rate)
      // Use 0 decimals for non-USD since we ceil to whole number
      return `${symbol}${displayFiatAmount(amountInBrandCurrency, 0)}`
    },
    [fxRates, brand.currency]
  )

  // Extract assets for wallet list modal and sync token map to ref
  // This ensures the ref is populated even when query returns cached data
  const allowedAssets = tokenQueryResult?.assets
  React.useEffect(() => {
    if (tokenQueryResult?.tokenMap != null) {
      tokenMinimumsRef.current = tokenQueryResult.tokenMap
    }
  }, [tokenQueryResult])

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
  const [amountInputError, setAmountInputError] = React.useState<
    string | undefined
  >()

  // Update selection when denominations become available (e.g., after brand fetch)
  React.useEffect(() => {
    if (hasFixedDenominations && selectedAmount == null) {
      const minDenom = sortedDenominations[0]
      setSelectedAmount(minDenom)
      setAmountText(String(minDenom))
    }
  }, [hasFixedDenominations, sortedDenominations, selectedAmount])

  // Handle amount text change for variable range
  const handleAmountChange = useHandler((text: string) => {
    // Clear warnings/errors when user modifies amount
    setMinimumWarning(null)
    setProductUnavailable(false)
    setError(null)
    setAmountInputError(undefined)

    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '')
    setAmountText(cleaned)

    const parsed = parseFloat(cleaned)
    // Always sync selectedAmount with the parsed value (even if invalid).
    // Validation is handled by isAmountValid which checks the range.
    if (!isNaN(parsed)) {
      setSelectedAmount(parsed)
    } else {
      setSelectedAmount(undefined)
    }
  })

  // Validate amount on blur for variable range cards
  const handleAmountBlur = useHandler(() => {
    if (!hasVariableRange || amountText === '') return

    const parsed = parseFloat(amountText)
    if (isNaN(parsed)) return

    const fiatSymbol = getFiatSymbol(brand.currency)
    if (parsed < minVal) {
      setAmountInputError(
        sprintf(
          lstrings.card_amount_min_error_message_1s,
          `${fiatSymbol}${minVal}`
        )
      )
    } else if (parsed > maxVal) {
      setAmountInputError(
        sprintf(
          lstrings.card_amount_max_error_message_1s,
          `${fiatSymbol}${maxVal}`
        )
      )
    }
  })

  // Handle MAX button press
  const handleMaxPress = useHandler(() => {
    if (hasVariableRange) {
      setMinimumWarning(null)
      setProductUnavailable(false)
      setError(null)
      setAmountInputError(undefined)
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
      // Clear warnings/errors when user modifies amount
      setMinimumWarning(null)
      setProductUnavailable(false)
      setError(null)
      setSelectedAmount(result.amount)
      setAmountText(String(result.amount))
    }
  })

  const handleNextPress = useHandler(async () => {
    if (
      selectedAmount == null ||
      provider == null ||
      !isReady ||
      isCreatingOrder
    ) {
      return
    }

    // Light accounts need to back up before purchasing gift cards
    if (checkAndShowLightBackupModal(account, navigation as NavigationBase)) {
      return
    }

    // Ensure token data is available before proceeding. If a previous fetch
    // failed, attempt a fresh fetch so the user isn't stuck on a dead-end.
    let resolvedAssets = allowedAssets
    if (resolvedAssets == null) {
      setIsCreatingOrder(true)
      try {
        const { data } = await refetchTokens()
        resolvedAssets = data?.assets
      } catch (err: unknown) {
        showError(err)
        return
      } finally {
        setIsCreatingOrder(false)
      }
    }

    if (resolvedAssets == null || resolvedAssets.length === 0) {
      showError(new Error(lstrings.gift_card_no_supported_assets))
      return
    }

    // Show wallet selection modal with only supported assets
    const walletResult = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        headerTitle={lstrings.gift_card_pay_from_wallet}
        navigation={navigation as NavigationBase}
        allowedAssets={resolvedAssets}
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

    // Get token info using original caip19 from Phaze API (preserves checksum case)
    const selectedAsset: EdgeAsset = {
      pluginId: wallet.currencyInfo.pluginId,
      tokenId
    }
    const tokenInfo = tokenMinimumsRef.current.get(assetKey(selectedAsset))

    if (tokenInfo == null) {
      showError(new Error('Unsupported cryptocurrency for gift card purchase'))
      return
    }

    const caip19 = tokenInfo.caip19

    // Get currency code for display (used in warnings, success, and error messages)
    const currencyCode =
      tokenId != null
        ? account.currencyConfig[wallet.currencyInfo.pluginId]?.allTokens[
            tokenId
          ]?.currencyCode ?? wallet.currencyInfo.currencyCode
        : wallet.currencyInfo.currencyCode

    // Check minimum amount for selected token
    if (selectedAmount < tokenInfo.minimumAmountInUSD) {
      setMinimumWarning({
        header: sprintf(
          lstrings.gift_card_minimum_warning_header_1s,
          currencyCode
        ),
        footer: sprintf(
          lstrings.gift_card_minimum_warning_footer_1s,
          formatMinimumInBrandCurrency(tokenInfo.minimumAmountInUSD)
        )
      })
      return
    }

    debugLog('phaze', 'Creating order:', {
      brandName: brand.brandName,
      productId: brand.productId,
      amount: selectedAmount,
      currency: brand.currency,
      tokenIdentifier: caip19
    })

    setIsCreatingOrder(true)

    try {
      // Create order with Phaze API
      const orderResponse = await provider.createOrder({
        tokenIdentifier: caip19,
        cart: [
          {
            orderId: uuidv4(),
            price: selectedAmount,
            productId: brand.productId
          }
        ]
      })

      debugLog('phaze', 'Order created:', {
        quoteId: orderResponse.quoteId,
        deliveryAddress: orderResponse.deliveryAddress,
        quantity: orderResponse.quantity,
        amountInUSD: orderResponse.amountInUSD,
        quoteExpiry: orderResponse.quoteExpiry
      })

      // Ensure we have a payment address before navigating to send
      if (orderResponse.deliveryAddress === '') {
        throw new Error(lstrings.gift_card_no_payment_address)
      }

      // Store the order for the onDone callback
      pendingOrderRef.current = orderResponse

      // Convert quantity to native amount (crypto amount to pay)
      // The quantity is in the token's standard units (e.g., BTC, ETH)
      const multiplier =
        tokenId != null
          ? account.currencyConfig[wallet.currencyInfo.pluginId]?.allTokens[
              tokenId
            ]?.denominations[0]?.multiplier ?? '1'
          : wallet.currencyInfo.denominations[0]?.multiplier ?? '1'

      // quantity from API is in decimal units, convert to native
      const quantity = orderResponse.quantity.toFixed(DECIMAL_PRECISION)
      const nativeAmount = String(ceil(mul(quantity, multiplier), 0))

      // Calculate expiry time (quoteExpiry is Unix timestamp in milliseconds)
      const expiryDate = new Date(orderResponse.quoteExpiry)
      const isoExpireDate = expiryDate.toISOString()

      // Navigate to SendScene2
      navigation.navigate('send2', {
        walletId,
        tokenId,
        spendInfo: {
          tokenId,
          spendTargets: [
            {
              publicAddress: orderResponse.deliveryAddress,
              nativeAmount
            }
          ],
          metadata: {
            name: lstrings.gift_card_recipient_name,
            // Store quoteId in notes for linking in TransactionDetailsScene
            notes: `Phaze gift card purchase - ${brand.brandName} ${selectedAmount} ${brand.currency}\nQuoteId: ${orderResponse.quoteId}`
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
            value: `${selectedAmount} ${brand.currency}`
          },
          {
            label: lstrings.gift_card_pay_amount,
            value: `${orderResponse.quantity} ${currencyCode}`
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
        onExpired: () => {
          // Quote expired - navigate back to purchase scene and show toast
          navigation.goBack()
          showToast(lstrings.gift_card_quote_expired_toast)
        },
        onDone: async (error: Error | null, tx?: EdgeTransaction) => {
          if (error != null) {
            debugLog('phaze', 'Transaction error:', error)
            return
          }
          if (tx != null && pendingOrderRef.current != null) {
            debugLog('phaze', 'Transaction successful:', tx.txid)

            const order = pendingOrderRef.current

            // Save the gift card action to the transaction (synced via edge-core)
            const savedAction: EdgeTxActionGiftCard = {
              actionType: 'giftCard',
              orderId: order.quoteId,
              provider: {
                providerId: 'phaze',
                displayName: 'Phaze'
              },
              card: {
                name: brand.brandName,
                imageUrl: brand.productImage,
                fiatAmount: String(selectedAmount),
                fiatCurrencyCode: `iso:${brand.currency}`
              }
              // redemption is populated later by polling service
            }

            await wallet.saveTxAction({
              txid: tx.txid,
              tokenId,
              assetAction: { assetActionType: 'giftCard' },
              savedAction
            })

            // Save order augment (tx link + brand/amount info for list scene)
            await provider.saveOrderAugment(account, order.quoteId, {
              walletId,
              tokenId,
              txid: tx.txid,
              brandName: brand.brandName,
              brandImage: brand.productImage,
              fiatAmount: selectedAmount,
              fiatCurrency: brand.currency
            })

            // Show toast
            showToast(lstrings.gift_card_pending_toast)

            // Navigate to gift card list to see the pending order
            navigation.navigate('giftCardList')
          }
        }
      })
    } catch (err: unknown) {
      debugLog('phaze', 'Order creation error:', err)

      // Clear previous warnings/errors
      setMinimumWarning(null)
      setProductUnavailable(false)
      setError(null)

      const errorMessage = err instanceof Error ? err.message : ''

      // Check for product unavailable error
      if (errorMessage.includes('Product is unavailable')) {
        setProductUnavailable(true)
        return
      }

      // Check for minimum amount error from API (with specific minimum)
      const minimumMatch = /Minimum cart cost should be above: ([\d.]+)/.exec(
        errorMessage
      )

      // Check for generic "order too small" error (no specific minimum)
      const isGenericMinimumError = errorMessage.includes(
        'Order amount is too small'
      )

      if (minimumMatch != null) {
        const minimumUSD = parseFloat(minimumMatch[1])
        setMinimumWarning({
          header: sprintf(
            lstrings.gift_card_minimum_warning_header_1s,
            currencyCode
          ),
          footer: sprintf(
            lstrings.gift_card_minimum_warning_footer_1s,
            formatMinimumInBrandCurrency(minimumUSD)
          )
        })
      } else if (isGenericMinimumError) {
        setMinimumWarning({
          header: sprintf(
            lstrings.gift_card_minimum_warning_header_1s,
            currencyCode
          ),
          footer: lstrings.gift_card_minimum_warning_generic
        })
      } else {
        // Show ErrorCard for other errors
        setError(err)
      }
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
              disabled: !isAmountValid || isCreatingOrder || isProviderError,
              spinner: isCreatingOrder
            }}
          />
        )
      }}
      scroll
    >
      <SceneContainer>
        {/* Hero brand image - rectangular full-width display (differs from
            CircularBrandIcon which is circular with border for list items) */}
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
                      setMinimumWarning(null)
                      setProductUnavailable(false)
                      setError(null)
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
                onBlur={handleAmountBlur}
                keyboardType="decimal-pad"
                returnKeyType="done"
                placeholder={`${minVal} ${brand.currency} - ${maxVal} ${brand.currency}`}
                clearIcon
                textsizeRem={1.5}
                error={amountInputError}
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

        {/* Warnings/Errors - provider error, product unavailable, minimum, or general */}
        {isProviderError ? (
          <AlertCardUi4 type="warning" title={lstrings.gift_card_load_error} />
        ) : productUnavailable ? (
          <AlertCardUi4
            type="warning"
            title={lstrings.gift_card_product_unavailable_title}
            body={lstrings.gift_card_product_unavailable_warning}
          />
        ) : minimumWarning != null ? (
          <AlertCardUi4
            type="warning"
            title={lstrings.gift_card_minimum_warning_title}
            header={minimumWarning.header}
            footer={minimumWarning.footer}
          />
        ) : error != null ? (
          <ErrorCard error={error} />
        ) : null}

        {/* Product Description Card */}
        {brand.productDescription == null ? (
          // Shimmer while loading
          <ShimmerCard heightRem={6} />
        ) : brand.productDescription !== '' ? (
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
  fixedAmountContent: {
    minWidth: theme.rem(8)
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
