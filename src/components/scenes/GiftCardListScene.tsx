import { useIsFocused } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { Linking, ScrollView, View } from 'react-native'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import { readSyncedSettings } from '../../actions/SettingsActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import {
  mergeOrdersWithAugments,
  refreshPhazeAugmentsCache,
  saveOrderAugment,
  usePhazeOrderAugments
} from '../../plugins/gift-cards/phazeGiftCardOrderStore'
import type { PhazeDisplayOrder } from '../../plugins/gift-cards/phazeGiftCardTypes'
import type { FooterRender } from '../../state/SceneFooterState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { debugLog } from '../../util/logger'
import { SceneButtons } from '../buttons/SceneButtons'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import {
  GiftCardDisplayCard,
  type GiftCardStatus
} from '../cards/GiftCardDisplayCard'
import { CircularBrandIcon } from '../common/CircularBrandIcon'
import { DividerLineUi4 } from '../common/DividerLineUi4'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { ButtonsModal } from '../modals/ButtonsModal'
import {
  GiftCardMenuModal,
  type GiftCardMenuResult
} from '../modals/GiftCardMenuModal'
import { FillLoader } from '../progress-indicators/FillLoader'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { SceneFooterWrapper } from '../themed/SceneFooterWrapper'

interface Props extends EdgeAppSceneProps<'giftCardList'> {}

const POLL_INTERVAL_MS = 10000

/** List of purchased gift cards */
export const GiftCardListScene: React.FC<Props> = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const isConnected = useSelector(state => state.network.isConnected)
  const countryCode = useSelector(state => state.ui.settings.countryCode)
  const stateProvinceCode = useSelector(
    state => state.ui.settings.stateProvinceCode
  )

  const isFocused = useIsFocused()

  // Get Phaze provider for API access
  const phazeConfig = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)
    ?.phaze as { apiKey?: string; baseUrl?: string } | undefined
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey: phazeConfig?.apiKey ?? '',
    baseUrl: phazeConfig?.baseUrl ?? ''
  })

  // Get augments from synced storage
  const augments = usePhazeOrderAugments()

  // Fetch orders + brands from API via TanStack Query.
  // Query key includes rootLoginId so each account gets its own cache entry.
  // Polling and focus gating are handled by refetchInterval + enabled.
  const {
    data: apiOrders,
    isLoading,
    isError: loadError
  } = useQuery({
    queryKey: ['phazeOrders', account.rootLoginId],
    queryFn: async () => {
      if (provider == null) throw new Error('Provider not ready')

      await provider.getMarketBrands(countryCode)
      const allOrders = await provider.getAllOrdersFromAllIdentities(account)
      debugLog('phaze', 'Got', allOrders.length, 'orders from API')
      return allOrders
    },
    enabled: isFocused && isReady,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnMount: 'always',
    staleTime: POLL_INTERVAL_MS
  })

  // Brand lookup function using provider cache
  const brandLookup = React.useCallback(
    (productId: number): string | undefined => {
      const brand = provider?.getCachedBrand(countryCode, productId)
      return brand?.productImage
    },
    [countryCode, provider]
  )

  // Merge API orders with local augments, then split into active/redeemed.
  // Recomputes when augments change (e.g., user marks as redeemed) without
  // needing an API refetch.
  const { activeOrders, redeemedOrders } = React.useMemo(() => {
    if (apiOrders == null) return { activeOrders: [], redeemedOrders: [] }

    const merged = mergeOrdersWithAugments(apiOrders, augments, brandLookup)
    const relevantOrders = merged.filter(
      order => order.vouchers.length > 0 || order.txid != null
    )

    return {
      activeOrders: relevantOrders.filter(order => order.redeemedDate == null),
      redeemedOrders: relevantOrders.filter(order => order.redeemedDate != null)
    }
  }, [apiOrders, augments, brandLookup])

  // Footer height for floating button
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  // Load augments on mount
  useAsyncEffect(
    async () => {
      await refreshPhazeAugmentsCache(account)
    },
    [],
    'GiftCardListScene:refreshAugments'
  )

  const handlePurchaseNew = useHandler(async () => {
    // Provider auto-registers user if needed via ensureUser()
    // Ensure country is set:
    let nextCountryCode = countryCode
    if (nextCountryCode === '') {
      await dispatch(
        showCountrySelectionModal({
          account,
          countryCode: '',
          stateProvinceCode
        })
      )
      // Re-read from synced settings to determine if user actually selected:
      const synced = await readSyncedSettings(account)
      nextCountryCode = synced.countryCode ?? ''
    }
    // Only navigate if we have a country code selected:
    if (nextCountryCode !== '') {
      navigation.navigate('giftCardMarket')
    }
  })

  // Show menu modal for an order
  const handleMenuPress = useHandler(
    async (order: PhazeDisplayOrder, isRedeemed: boolean) => {
      const result = await Airship.show<GiftCardMenuResult>(bridge => (
        <GiftCardMenuModal
          bridge={bridge}
          order={order}
          isRedeemed={isRedeemed}
        />
      ))

      if (result == null) return

      if (result.type === 'goToTransaction') {
        navigation.navigate('transactionDetails', {
          edgeTransaction: result.transaction,
          walletId: result.walletId
        })
      } else if (result.type === 'markAsRedeemed') {
        await saveOrderAugment(account, order.quoteId, {
          redeemedDate: new Date()
        })
      } else if (result.type === 'unmarkAsRedeemed') {
        await saveOrderAugment(account, order.quoteId, {
          redeemedDate: undefined
        })
      } else if (result.type === 'getHelp') {
        navigation.navigate('giftCardAccountInfo', {
          quoteId: order.quoteId
        })
      }
    }
  )

  // Handle redeem flow: open URL, then prompt to mark as redeemed
  const handleRedeemComplete = useHandler(async (order: PhazeDisplayOrder) => {
    const redemptionUrl = order.vouchers?.[0]?.url
    if (redemptionUrl == null) return

    // Open redemption URL in webview
    await Linking.openURL(redemptionUrl).catch(() => {})

    // After webview closes, ask if they want to mark as redeemed
    const result = await Airship.show<'yes' | 'no' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.gift_card}
        message={lstrings.gift_card_mark_redeemed_prompt}
        buttons={{
          yes: { label: lstrings.yes },
          no: { label: lstrings.no }
        }}
      />
    ))

    if (result === 'yes') {
      await saveOrderAugment(account, order.quoteId, {
        redeemedDate: new Date()
      })
    }
  })

  const handleFooterLayoutHeight = useHandler((height: number) => {
    setFooterHeight(height)
  })

  /**
   * Derive card status from order data:
   * - confirming: Payment tx sent, awaiting blockchain confirmations
   * - pending: Confirmations received, waiting for voucher
   * - available: Has voucher, not yet redeemed
   * - failed: Order failed or expired
   * - redeemed: User marked as redeemed
   */
  const getCardStatus = React.useCallback(
    (order: PhazeDisplayOrder): GiftCardStatus => {
      if (order.redeemedDate != null) return 'redeemed'
      if (order.status === 'failed' || order.status === 'expired')
        return 'failed'
      if (order.vouchers.length > 0) return 'available'
      // Phaze API status 'processing' means payment confirmed, generating
      // vouchers. Otherwise txid present means tx broadcast, awaiting
      // Phaze confirmation.
      if (order.status === 'processing') return 'pending'
      if (order.txid != null) return 'confirming'
      return 'pending'
    },
    []
  )

  const renderCard = (order: PhazeDisplayOrder): React.ReactElement => {
    const status = getCardStatus(order)

    if (status === 'redeemed') {
      const fiatSymbol = getFiatSymbol(order.fiatCurrency)
      const formattedAmount = `${fiatSymbol} ${order.fiatAmount}`

      return (
        <EdgeCard
          key={order.quoteId}
          icon={<CircularBrandIcon imageUrl={order.brandImage} />}
          onPress={() => {
            handleMenuPress(order, true).catch(() => {})
          }}
        >
          <View style={styles.listTextContainer}>
            <EdgeText
              style={styles.listBrandName}
              numberOfLines={1}
              disableFontScaling
            >
              {order.brandName}
            </EdgeText>
            <EdgeText style={styles.listAmount} numberOfLines={1}>
              {formattedAmount}
            </EdgeText>
          </View>
        </EdgeCard>
      )
    }

    return (
      <View key={order.quoteId} style={styles.cardContainer}>
        <GiftCardDisplayCard
          order={order}
          status={status}
          onMenuPress={() => {
            handleMenuPress(order, false).catch(() => {})
          }}
          onGetHelpPress={
            status !== 'failed'
              ? undefined
              : () => {
                  navigation.navigate('giftCardAccountInfo', {
                    quoteId: order.quoteId
                  })
                }
          }
          onRedeemComplete={
            status !== 'available'
              ? undefined
              : () => {
                  handleRedeemComplete(order).catch(() => {})
                }
          }
        />
      </View>
    )
  }

  const renderFooter: FooterRender = React.useCallback(
    sceneWrapperInfo => {
      return (
        <SceneFooterWrapper
          key="GiftCardListScene-Footer"
          sceneWrapperInfo={sceneWrapperInfo}
          onLayoutHeight={handleFooterLayoutHeight}
          noBackgroundBlur
        >
          <SceneButtons
            primary={{
              label: lstrings.gift_card_list_purchase_new_button,
              onPress: handlePurchaseNew,
              disabled: !isConnected || loadError
            }}
          />
        </SceneFooterWrapper>
      )
    },
    [handleFooterLayoutHeight, handlePurchaseNew, isConnected, loadError]
  )

  const hasNoCards = activeOrders.length === 0 && redeemedOrders.length === 0

  return (
    <SceneWrapper
      // Use 0 while loading so the FillLoader centers in the full scene area
      // without jumping when the footer measures its height.
      footerHeight={isLoading ? 0 : footerHeight}
      renderFooter={renderFooter}
    >
      {({ insetStyle, undoInsetStyle }) => (
        <SceneContainer
          undoInsetStyle={undoInsetStyle}
          headerTitle={lstrings.gift_card_branded}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
                paddingRight: insetStyle.paddingRight + theme.rem(0.5),
                paddingBottom: insetStyle.paddingBottom + theme.rem(1)
              },
              !isLoading && hasNoCards && styles.emptyContainer
            ]}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          >
            {isLoading ? (
              <FillLoader />
            ) : hasNoCards && loadError ? (
              <Paragraph center>
                {isConnected
                  ? lstrings.gift_card_service_error
                  : lstrings.gift_card_network_error}
              </Paragraph>
            ) : hasNoCards ? (
              <Paragraph center>{lstrings.gift_card_list_no_cards}</Paragraph>
            ) : (
              <>
                {/* Error banner when data exists but refresh failed */}
                {loadError ? (
                  <AlertCardUi4
                    type="warning"
                    title={
                      isConnected
                        ? lstrings.gift_card_refresh_service_error
                        : lstrings.gift_card_refresh_error
                    }
                  />
                ) : null}

                {/* Active Cards Section */}
                {activeOrders.map(order => renderCard(order))}

                {/* Redeemed Cards Section */}
                {redeemedOrders.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <EdgeText style={styles.sectionHeaderTitle}>
                        {lstrings.gift_card_redeemed_cards}
                      </EdgeText>
                      <DividerLineUi4 extendRight />
                    </View>
                    {redeemedOrders.map(order => renderCard(order))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardContainer: {
    marginTop: theme.rem(0.75)
  },
  sectionHeader: {
    marginTop: theme.rem(1),
    marginLeft: theme.rem(0.5)
  },
  sectionHeaderTitle: {
    fontSize: theme.rem(1.2),
    fontFamily: theme.fontFaceMedium,
    marginBottom: theme.rem(0.5)
  },
  // List view styles (for redeemed cards)
  listTextContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: theme.rem(0.5)
  },
  listBrandName: {
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  listAmount: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))
