import { useFocusEffect } from '@react-navigation/native'
import * as React from 'react'
import { ScrollView, View } from 'react-native'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import { readSyncedSettings } from '../../actions/SettingsActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
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
import type {
  PhazeDisplayOrder,
  PhazeOrderStatusItem
} from '../../plugins/gift-cards/phazeGiftCardTypes'
import type { FooterRender } from '../../state/SceneFooterState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { debugLog } from '../../util/logger'
import { makePeriodicTask } from '../../util/PeriodicTask'
import { SceneButtons } from '../buttons/SceneButtons'
import {
  GiftCardDisplayCard,
  type GiftCardStatus
} from '../cards/GiftCardDisplayCard'
import { DividerLineUi4 } from '../common/DividerLineUi4'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { ButtonsModal } from '../modals/ButtonsModal'
import {
  GiftCardMenuModal,
  type GiftCardMenuResult
} from '../modals/GiftCardMenuModal'
import { showWebViewModal } from '../modals/WebViewModal'
import { FillLoader } from '../progress-indicators/FillLoader'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { SceneFooterWrapper } from '../themed/SceneFooterWrapper'

interface Props extends EdgeAppSceneProps<'giftCardList'> {}

/**
 * Module-level cache to persist order data across scene mounts.
 * Keyed by account ID to prevent data leaking between user sessions.
 */
let cachedAccountId: string | null = null
let cachedApiOrders: PhazeOrderStatusItem[] = []
let cachedActiveOrders: PhazeDisplayOrder[] = []
let cachedRedeemedOrders: PhazeDisplayOrder[] = []
/** Necessary to ensure if the user truly has zero gift cards, we don't show loading every time. */
let hasLoadedOnce = false
/** Track if brands have been loaded at least once (brands change infrequently) */
let hasFetchedBrands = false

/** Clear module-level cache (called when account changes) */
const clearOrderCache = (): void => {
  cachedApiOrders = []
  cachedActiveOrders = []
  cachedRedeemedOrders = []
  hasLoadedOnce = false
  hasFetchedBrands = false
}

/** List of purchased gift cards */
export const GiftCardListScene: React.FC<Props> = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const { countryCode, stateProvinceCode } = useSelector(
    state => state.ui.settings
  )

  // Clear cache if account changed (prevents data leaking between users)
  if (cachedAccountId !== account.id) {
    clearOrderCache()
    cachedAccountId = account.id
  }

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

  // Orders from Phaze API merged with augments - separate active and redeemed
  // Initialize from module-level cache to avoid flash of empty state on re-mount
  const [activeOrders, setActiveOrders] =
    React.useState<PhazeDisplayOrder[]>(cachedActiveOrders)
  const [redeemedOrders, setRedeemedOrders] =
    React.useState<PhazeDisplayOrder[]>(cachedRedeemedOrders)
  // Only show loading on very first load; subsequent mounts refresh silently
  const [isLoading, setIsLoading] = React.useState(!hasLoadedOnce)

  // Footer height for floating button
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  // Brand lookup function using provider cache
  const brandLookup = React.useCallback(
    (productId: number): string | undefined => {
      const brand = provider?.getCachedBrand(countryCode, productId)
      return brand?.productImage
    },
    [countryCode, provider]
  )

  // Apply augments to cached API orders (no API call)
  const applyAugments = React.useCallback(
    (apiOrders: typeof cachedApiOrders) => {
      const merged = mergeOrdersWithAugments(apiOrders, augments, brandLookup)

      // Show all orders that have augments (we purchased them) or have vouchers
      const relevantOrders = merged.filter(
        order => order.vouchers.length > 0 || order.txid != null
      )

      // Separate active and redeemed
      const active = relevantOrders.filter(order => order.redeemedDate == null)
      const redeemed = relevantOrders.filter(
        order => order.redeemedDate != null
      )

      cachedActiveOrders = active
      cachedRedeemedOrders = redeemed
      setActiveOrders(active)
      setRedeemedOrders(redeemed)
    },
    [augments, brandLookup]
  )

  // Fetch orders from API (full refresh)
  const loadOrdersFromApi = React.useCallback(
    async (includeBrands: boolean): Promise<boolean> => {
      debugLog('phaze', 'loadOrdersFromApi called, isReady:', isReady)
      if (provider == null || !isReady) {
        debugLog('phaze', 'Provider not ready, skipping')
        return false
      }

      try {
        // Aggregate orders from all identities
        const allOrders = await provider.getAllOrdersFromAllIdentities(account)
        debugLog('phaze', 'Got', allOrders.length, 'orders from API')
        cachedApiOrders = allOrders

        // Only fetch brands on first load (they change infrequently)
        let didFetchBrands = false
        if (includeBrands) {
          await provider.getMarketBrands(countryCode)
          didFetchBrands = true
        }

        applyAugments(allOrders)
        return didFetchBrands
      } catch (err: unknown) {
        debugLog('phaze', 'Error loading orders:', err)
        setActiveOrders([])
        setRedeemedOrders([])
        return false
      } finally {
        setIsLoading(false)
        hasLoadedOnce = true
      }
    },
    [account, provider, isReady, countryCode, applyAugments]
  )

  // Re-apply augments when they change (no API call needed)
  React.useEffect(() => {
    if (cachedApiOrders.length > 0) {
      applyAugments(cachedApiOrders)
    }
  }, [augments, applyAugments])

  // Load augments on mount
  useAsyncEffect(
    async () => {
      await refreshPhazeAugmentsCache(account)
    },
    [],
    'GiftCardListScene:refreshAugments'
  )

  // Reload orders when scene comes into focus, then poll periodically
  // to detect when pending orders receive their vouchers
  useFocusEffect(
    React.useCallback(() => {
      // First load: fetch both brands and orders
      // Subsequent loads: only fetch orders (brands change infrequently)
      const includeBrands = !hasFetchedBrands
      loadOrdersFromApi(includeBrands)
        .then(didFetchBrands => {
          if (didFetchBrands) hasFetchedBrands = true
        })
        .catch(() => {})

      // Poll every 10 seconds while focused (orders only, not brands)
      const task = makePeriodicTask(
        async () => {
          await loadOrdersFromApi(false)
        },
        10000,
        { onError: () => {} }
      )
      task.start()

      return () => {
        task.stop()
      }
    }, [loadOrdersFromApi])
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
      }
    }
  )

  // Handle redeem flow: open URL, then prompt to mark as redeemed
  const handleRedeemComplete = useHandler(async (order: PhazeDisplayOrder) => {
    const redemptionUrl = order.vouchers?.[0]?.url
    if (redemptionUrl == null) return

    // Open redemption URL in webview
    await showWebViewModal(order.brandName, redemptionUrl)

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
   * - pending: Broadcasted but no voucher yet
   * - available: Has voucher, not yet redeemed
   * - redeemed: User marked as redeemed
   */
  const getCardStatus = React.useCallback(
    (order: PhazeDisplayOrder): GiftCardStatus => {
      if (order.redeemedDate != null) return 'redeemed'
      if (order.vouchers.length === 0) return 'pending'
      return 'available'
    },
    []
  )

  const renderCard = (order: PhazeDisplayOrder): React.ReactElement => {
    const status = getCardStatus(order)
    return (
      <View key={order.quoteId} style={styles.cardContainer}>
        <GiftCardDisplayCard
          order={order}
          status={status}
          onMenuPress={() => {
            handleMenuPress(order, status === 'redeemed').catch(() => {})
          }}
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
              onPress: handlePurchaseNew
            }}
          />
        </SceneFooterWrapper>
      )
    },
    [handleFooterLayoutHeight, handlePurchaseNew]
  )

  const hasNoCards = activeOrders.length === 0 && redeemedOrders.length === 0

  return (
    <SceneWrapper footerHeight={footerHeight} renderFooter={renderFooter}>
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
                paddingLeft: insetStyle.paddingLeft + theme.rem(1),
                paddingRight: insetStyle.paddingRight + theme.rem(1),
                paddingBottom: insetStyle.paddingBottom + theme.rem(1)
              },
              !isLoading && hasNoCards && styles.emptyContainer
            ]}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          >
            {isLoading ? (
              <FillLoader />
            ) : hasNoCards ? (
              <Paragraph center>{lstrings.gift_card_list_no_cards}</Paragraph>
            ) : (
              <>
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
    marginTop: theme.rem(1)
  },
  sectionHeaderTitle: {
    fontSize: theme.rem(1.2),
    fontFamily: theme.fontFaceMedium,
    marginBottom: theme.rem(0.5)
  }
}))
