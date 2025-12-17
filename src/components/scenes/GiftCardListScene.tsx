import { useFocusEffect } from '@react-navigation/native'
import * as React from 'react'
import { FlatList, type ListRenderItem, View } from 'react-native'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import { readSyncedSettings } from '../../actions/SettingsActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import {
  clearAllPhazeOrders,
  refreshPhazeOrdersCache,
  usePhazeOrders
} from '../../plugins/gift-cards/phazeGiftCardOrderStore'
import {
  asPhazeUser,
  PHAZE_IDENTITY_DISKLET_NAME,
  type PhazePersistedOrder
} from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { getDiskletFormData } from '../../util/formUtils'
import { SceneButtons } from '../buttons/SceneButtons'
import { GiftCardDisplayCard } from '../cards/GiftCardDisplayCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { showError } from '../services/AirshipInstance'
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
  // Use account.disklet for synced storage across devices
  const disklet = account.disklet
  const { countryCode, stateProvinceCode } = useSelector(
    state => state.ui.settings
  )

  // Reactive orders list - auto-updates when orders change (e.g., from polling)
  const orders = usePhazeOrders()

  // Refresh cache from disklet when scene comes into focus.
  // This picks up orders synced from other devices.
  useFocusEffect(
    React.useCallback(() => {
      refreshPhazeOrdersCache(account).catch(() => {})
    }, [account])
  )

  // Debug: Clear all saved orders
  const handleClearOrders = useHandler(async () => {
    await clearAllPhazeOrders(account)
  })

  const handlePurchaseNew = useHandler(async () => {
    // Check for saved user with userApiKey:
    const phazeUser = await getDiskletFormData(
      disklet,
      PHAZE_IDENTITY_DISKLET_NAME,
      asPhazeUser
    )
    if (phazeUser?.userApiKey == null) {
      navigation.navigate('giftCardIdentityForm')
      return
    }
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

  // Navigate to transaction details
  const handleInfoPress = useHandler(async (order: PhazePersistedOrder) => {
    if (order.txid != null && order.walletId != null) {
      const wallet = account.currencyWallets[order.walletId]
      if (wallet != null) {
        try {
          const txs = await wallet.getTransactions({
            tokenId: order.tokenId ?? null,
            searchString: order.txid
          })
          const tx = txs.find(t => t.txid === order.txid)
          if (tx != null) {
            navigation.navigate('transactionDetails', {
              edgeTransaction: tx,
              walletId: order.walletId
            })
          }
        } catch (err: unknown) {
          showError(err)
        }
      }
    }
  })

  const renderItem: ListRenderItem<PhazePersistedOrder> = React.useCallback(
    ({ item }) => (
      <GiftCardDisplayCard
        order={item}
        onInfoPress={() => {
          handleInfoPress(item).catch(() => {})
        }}
      />
    ),
    [handleInfoPress]
  )

  const renderEmpty = React.useCallback(() => {
    return <Paragraph center>{lstrings.gift_card_list_no_cards}</Paragraph>
  }, [])

  const keyExtractor = React.useCallback(
    (item: PhazePersistedOrder) => item.quoteId,
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
            data={orders}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={{
              paddingTop: theme.rem(0.5),
              paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
              paddingRight: insetStyle.paddingRight + theme.rem(0.5),
              paddingBottom: theme.rem(1),
              flexGrow: orders.length === 0 ? 1 : undefined,
              justifyContent: orders.length === 0 ? 'center' : undefined,
              alignItems: orders.length === 0 ? 'center' : undefined
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
            tertiary={{
              label: '[DEBUG] Clear Saved Cards',
              onPress: handleClearOrders
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
