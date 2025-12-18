import { useFocusEffect } from '@react-navigation/native'
import * as React from 'react'
import { FlatList, type ListRenderItem, View } from 'react-native'

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
import type { PhazeDisplayOrder } from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { GiftCardDisplayCard } from '../cards/GiftCardDisplayCard'
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
import { Paragraph } from '../themed/EdgeText'

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
  const apiKey = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)?.phaze as
    | { apiKey?: string }
    | undefined
  const phazeApiKey = apiKey?.apiKey ?? ''
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey: phazeApiKey
  })

  // Get augments from synced storage
  const augments = usePhazeOrderAugments()

  // Orders from Phaze API merged with augments
  const [displayOrders, setDisplayOrders] = React.useState<PhazeDisplayOrder[]>(
    []
  )
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch orders from ALL identities and merge with augments
  const loadOrders = React.useCallback(async () => {
    if (provider == null || !isReady) return

    try {
      // Aggregate orders from all identities (handles multi-device scenarios)
      const allOrders = await provider.getAllOrdersFromAllIdentities(account)

      // Merge API data with augments
      const merged = mergeOrdersWithAugments(allOrders, augments)

      // Filter to show only completed orders with vouchers, exclude redeemed
      const filtered = merged.filter(order => {
        const hasVouchers = order.vouchers.length > 0
        const isRedeemed = order.redeemedDate != null
        return hasVouchers && !isRedeemed
      })

      setDisplayOrders(filtered)
    } catch (err: unknown) {
      console.log('[GiftCardList] Error loading orders:', err)
      setDisplayOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [account, provider, isReady, augments])

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
  const handleMenuPress = useHandler(async (order: PhazeDisplayOrder) => {
    const result = await Airship.show<GiftCardMenuResult>(bridge => (
      <GiftCardMenuModal bridge={bridge} order={order} />
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
    }
  })

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

  const renderItem: ListRenderItem<PhazeDisplayOrder> = React.useCallback(
    ({ item: order }) => (
      <GiftCardDisplayCard
        order={order}
        onMenuPress={() => {
          handleMenuPress(order).catch(() => {})
        }}
        onRedeemComplete={() => {
          handleRedeemComplete(order).catch(() => {})
        }}
      />
    ),
    [handleMenuPress, handleRedeemComplete]
  )

  const renderEmpty = React.useCallback(() => {
    if (isLoading) return <FillLoader />
    return <Paragraph center>{lstrings.gift_card_list_no_cards}</Paragraph>
  }, [isLoading])

  const keyExtractor = React.useCallback(
    (item: PhazeDisplayOrder) => item.quoteId,
    []
  )

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <SceneContainer
          undoInsetStyle={undoInsetStyle}
          headerTitle={lstrings.gift_card}
        >
          <FlatList
            automaticallyAdjustContentInsets={false}
            data={displayOrders}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={{
              paddingTop: theme.rem(0.5),
              paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
              paddingRight: insetStyle.paddingRight + theme.rem(0.5),
              paddingBottom: theme.rem(1),
              flexGrow: displayOrders.length === 0 ? 1 : undefined,
              justifyContent: displayOrders.length === 0 ? 'center' : undefined,
              alignItems: displayOrders.length === 0 ? 'center' : undefined
            }}
            ItemSeparatorComponent={() => (
              <View style={{ height: theme.rem(0.75) }} />
            )}
            ListEmptyComponent={renderEmpty}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
          <SceneButtons
            primary={{
              label: lstrings.gift_card_list_purchase_new_button,
              onPress: handlePurchaseNew
            }}
          />
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    flexGrow: 1
  }
}))
