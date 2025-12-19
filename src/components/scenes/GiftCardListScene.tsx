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
import { makePhazeGiftCardCache } from '../../plugins/gift-cards/phazeGiftCardCache'
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
import { SceneButtons } from '../buttons/SceneButtons'
import { GiftCardDisplayCard } from '../cards/GiftCardDisplayCard'
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

  // Get Phaze provider for API access
  const phazeConfig = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)
    ?.phaze as { apiKey?: string; baseUrl?: string } | undefined
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey: phazeConfig?.apiKey ?? '',
    baseUrl: phazeConfig?.baseUrl ?? ''
  })

  // Cache for gift card brands (shared with market scene)
  const cache = React.useMemo(() => makePhazeGiftCardCache(account), [account])

  // Get augments from synced storage
  const augments = usePhazeOrderAugments()

  // Orders from Phaze API merged with augments - separate active and redeemed
  const [activeOrders, setActiveOrders] = React.useState<PhazeDisplayOrder[]>(
    []
  )
  const [redeemedOrders, setRedeemedOrders] = React.useState<
    PhazeDisplayOrder[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Footer height for floating button
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  // Fetch orders from ALL identities and merge with augments
  const loadOrders = React.useCallback(async () => {
    console.log('[GiftCardList] loadOrders called, isReady:', isReady)
    if (provider == null || !isReady) {
      console.log('[GiftCardList] Provider not ready, skipping')
      return
    }

    try {
      // Aggregate orders from all identities (handles multi-device scenarios racing to create multiple identities)
      const allOrders = await provider.getAllOrdersFromAllIdentities(account)
      console.log('[GiftCardList] Got', allOrders.length, 'orders from API')

      // Pre-load brands and populate both provider store AND shared cache
      // This ensures market scene shows instantly if user navigates there
      const brands = await provider.getMarketBrands(countryCode)
      cache.set(countryCode, brands)

      // Create brand lookup function to get images from cached brands
      const brandLookup = (productId: number): string | undefined => {
        const brand = provider.getCachedBrand(productId)
        return brand?.productImage
      }

      // Merge API data with augments, using brand cache for images
      const merged = mergeOrdersWithAugments(allOrders, augments, brandLookup)
      console.log('[GiftCardList] Merged orders:', merged.length)

      // Filter to show only completed orders with vouchers
      const withVouchers = merged.filter(order => order.vouchers.length > 0)

      // Separate active and redeemed
      const active = withVouchers.filter(order => order.redeemedDate == null)
      const redeemed = withVouchers.filter(order => order.redeemedDate != null)

      console.log(
        '[GiftCardList] Active:',
        active.length,
        'Redeemed:',
        redeemed.length
      )
      setActiveOrders(active)
      setRedeemedOrders(redeemed)
    } catch (err: unknown) {
      console.log('[GiftCardList] Error loading orders:', err)
      setActiveOrders([])
      setRedeemedOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [account, provider, isReady, augments, cache, countryCode])

  // Load augments on mount
  useAsyncEffect(
    async () => {
      await refreshPhazeAugmentsCache(account)
    },
    [],
    'GiftCardListScene:refreshAugments'
  )

  // Reload orders when scene comes into focus or augments change
  useFocusEffect(
    React.useCallback(() => {
      loadOrders().catch(() => {})
    }, [loadOrders])
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

  const renderCard = (
    order: PhazeDisplayOrder,
    isRedeemed: boolean
  ): React.ReactNode => (
    <View key={order.quoteId} style={styles.cardContainer}>
      <GiftCardDisplayCard
        order={order}
        isRedeemed={isRedeemed}
        onMenuPress={() => {
          handleMenuPress(order, isRedeemed).catch(() => {})
        }}
        onRedeemComplete={
          isRedeemed
            ? undefined
            : () => {
                handleRedeemComplete(order).catch(() => {})
              }
        }
      />
    </View>
  )

  const renderFooter: FooterRender = React.useCallback(
    sceneWrapperInfo => {
      return (
        <SceneFooterWrapper
          key="GiftCardListScene-Footer"
          sceneWrapperInfo={sceneWrapperInfo}
          onLayoutHeight={handleFooterLayoutHeight}
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
          headerTitle={lstrings.gift_card}
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
                {activeOrders.length > 0 && (
                  <>
                    {activeOrders.map(
                      async order => await renderCard(order, false)
                    )}
                  </>
                )}

                {/* Redeemed Cards Section */}
                {redeemedOrders.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <EdgeText style={styles.sectionHeaderTitle}>
                        {lstrings.gift_card_redeemed_cards}
                      </EdgeText>
                      <DividerLineUi4 extendRight />
                    </View>
                    {redeemedOrders.map(
                      async order => await renderCard(order, true)
                    )}
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
