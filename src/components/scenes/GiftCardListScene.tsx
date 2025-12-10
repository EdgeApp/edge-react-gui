import * as React from 'react'
import { FlatList, type ListRenderItem, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import { readSyncedSettings } from '../../actions/SettingsActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { listPhazeOrders } from '../../plugins/gift-cards/phazeGiftCardOrderStore'
import {
  asPhazeUser,
  PHAZE_IDENTITY_DISKLET_NAME,
  type PhazeStoredOrder
} from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { getDiskletFormData } from '../../util/formUtils'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'

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

  // State for purchased orders
  const [orders, setOrders] = React.useState<PhazeStoredOrder[]>([])

  // Load orders on mount and when screen focuses
  useAsyncEffect(
    async () => {
      const loadedOrders = await listPhazeOrders(account)
      setOrders(loadedOrders)
      return () => {}
    },
    [account],
    'GiftCardListScene:loadOrders'
  )

  // Refresh orders when navigating back to this screen
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      listPhazeOrders(account)
        .then(loadedOrders => {
          setOrders(loadedOrders)
        })
        .catch(() => {})
    })
    return unsubscribe
  }, [account, navigation])

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

  const handleOrderPress = useHandler(async (order: PhazeStoredOrder) => {
    // Navigate to transaction details if we have txid and walletId
    if (order.txid != null && order.walletId != null) {
      const wallet = account.currencyWallets[order.walletId]
      if (wallet != null) {
        try {
          // Get the transaction using the stored tokenId
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

  const renderItem: ListRenderItem<PhazeStoredOrder> = React.useCallback(
    ({ item }) => {
      const dateStr = new Date(item.createdAt).toLocaleString()

      const handlePress = (): void => {
        handleOrderPress(item).catch(() => {})
      }

      return (
        <EdgeCard
          icon={
            item.brandImage !== '' ? (
              <FastImage
                source={{ uri: item.brandImage }}
                style={styles.brandIcon}
                resizeMode={FastImage.resizeMode.contain}
              />
            ) : (
              <View style={styles.brandIconPlaceholder}>
                <IonIcon
                  name="gift"
                  size={theme.rem(1.5)}
                  color={theme.primaryText}
                />
              </View>
            )
          }
          onPress={handlePress}
        >
          <View style={styles.orderInfo}>
            <EdgeText style={styles.brandName}>{item.brandName}</EdgeText>
            <EdgeText style={styles.amountText}>
              ${item.fiatAmount} {item.fiatCurrency}
            </EdgeText>
            <EdgeText style={styles.dateText}>{dateStr}</EdgeText>
          </View>
          <IonIcon
            name="chevron-forward"
            size={theme.rem(1.5)}
            color={theme.iconTappable}
          />
        </EdgeCard>
      )
    },
    [
      handleOrderPress,
      styles.amountText,
      styles.brandIcon,
      styles.brandIconPlaceholder,
      styles.brandName,
      styles.dateText,
      styles.orderInfo,
      theme
    ]
  )

  const renderEmpty = React.useCallback(() => {
    return <Paragraph center>{lstrings.gift_card_list_no_cards}</Paragraph>
  }, [])

  const keyExtractor = React.useCallback(
    (item: PhazeStoredOrder) => item.quoteId,
    []
  )

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <SceneContainer
          undoInsetStyle={undoInsetStyle}
          expand
          headerTitle={lstrings.gift_card}
        >
          <FlatList
            automaticallyAdjustContentInsets={false}
            data={orders}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={{
              paddingTop: 0,
              paddingBottom: insetStyle.paddingBottom,
              paddingLeft: insetStyle.paddingLeft,
              paddingRight: insetStyle.paddingRight,
              flexGrow: orders.length === 0 ? 1 : undefined,
              justifyContent: orders.length === 0 ? 'center' : undefined,
              alignItems: orders.length === 0 ? 'center' : undefined
            }}
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
    flex: 1
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.rem(0.75)
  },
  brandIcon: {
    width: theme.rem(3),
    height: theme.rem(3),
    borderRadius: theme.rem(0.5),
    marginRight: theme.rem(0.75)
  },
  brandIconPlaceholder: {
    width: theme.rem(3),
    height: theme.rem(3),
    borderRadius: theme.rem(0.5),
    backgroundColor: theme.tileBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.rem(0.75)
  },
  orderInfo: {
    flex: 1
  },
  brandName: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceMedium
  },
  amountText: {
    fontSize: theme.rem(0.875),
    color: theme.iconTappable
  },
  dateText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))
