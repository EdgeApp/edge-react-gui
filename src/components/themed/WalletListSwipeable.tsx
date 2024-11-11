import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { useMemo } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import Animated from 'react-native-reanimated'

import { getFirstOpenInfo } from '../../actions/FirstOpenActions'
import { selectWalletToken } from '../../actions/WalletActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { filterWalletCreateItemListBySearchText, getCreateWalletList, WalletCreateItem } from '../../selectors/getCreateWalletList'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase, WalletsTabSceneProps } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { EdgeAnim, MAX_LIST_ITEMS_ANIM } from '../common/EdgeAnim'
import { InsetStyle } from '../common/SceneWrapper'
import { searchWalletList } from '../services/SortedWalletList'
import { useTheme } from '../services/ThemeContext'
import { WalletListCreateRow } from './WalletListCreateRow'
import { WalletListSwipeableCurrencyRow } from './WalletListSwipeableCurrencyRow'
import { WalletListSwipeableLoadingRow } from './WalletListSwipeableLoadingRow'

interface Props {
  footer?: React.ComponentType<{}> | React.ReactElement
  header?: React.ComponentType<{}> | React.ReactElement
  navigation: WalletsTabSceneProps<'walletList'>['navigation']

  searching: boolean
  searchText: string
  insetStyle: InsetStyle

  // Callbacks:
  onRefresh?: () => void
  onReset?: () => void
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

/**
 * The main wallet list used in a scene.
 */
function WalletListSwipeableComponent(props: Props) {
  const {
    footer,
    header,
    navigation,
    searching,
    searchText,
    insetStyle,

    // Callbacks:
    onRefresh,
    onReset
  } = props

  // Subscriptions:
  const theme = useTheme()
  const dispatch = useDispatch()
  const sortedWalletList = useSelector(state => state.sortedWalletList)
  const account = useSelector(state => state.core.account)

  // This list is shown when we're in a searching state
  const createWalletList = React.useMemo(
    () => (searching ? filterWalletCreateItemListBySearchText(getCreateWalletList(account, { filteredWalletList: sortedWalletList }), searchText) : []),
    [account, searching, searchText, sortedWalletList]
  )

  const handleCreateWallet = useHandler(async (walletId: string, tokenId: EdgeTokenId) => {
    const wallet = account.currencyWallets[walletId]
    const { countryCode } = await getFirstOpenInfo()
    dispatch(selectWalletToken({ navigation: navigation as NavigationBase, walletId, tokenId }))
      .then(
        activationNotRequired =>
          activationNotRequired &&
          navigation.navigate('transactionList', {
            walletId,
            tokenId,
            walletName: wallet.name ?? wallet.currencyInfo.displayName,
            countryCode
          })
      )
      .finally(onReset)
  })

  // Filter based on the search text:
  const searchedWalletList = React.useMemo(() => searchWalletList(sortedWalletList, searchText), [sortedWalletList, searchText])

  // Render the refresh control:
  const refreshControl = React.useMemo(() => {
    if (onRefresh == null) return undefined
    return <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.searchListRefreshControlIndicator} />
  }, [theme, onRefresh])

  // Renders a single row:
  const renderRow = useHandler((item: FlatListItem<any>) => {
    const { index } = item
    if (item.item.key.includes('create-')) {
      const createItem: WalletCreateItem = item.item
      return (
        <WalletListCreateRow
          createItem={createItem}
          trackingEventFailed="Create_Wallet_From_Search_Failed"
          trackingEventSuccess="Create_Wallet_From_Search_Success"
          onPress={handleCreateWallet}
        />
      )
    }

    const { token, tokenId, wallet, walletId } = item.item

    const disableAnimation = index >= MAX_LIST_ITEMS_ANIM
    if (wallet != null) {
      return (
        <EdgeAnim disableAnimation={disableAnimation} enter={{ type: 'fadeInDown', distance: 20 * (index + 1) }}>
          <WalletListSwipeableCurrencyRow navigation={navigation} token={token} tokenId={tokenId} wallet={wallet} />
        </EdgeAnim>
      )
    }
    if (walletId != null) {
      return (
        <EdgeAnim disableAnimation={disableAnimation} enter={{ type: 'fadeInDown', distance: 20 * (index + 1) }}>
          <WalletListSwipeableLoadingRow navigation={navigation} walletId={walletId} />
        </EdgeAnim>
      )
    }
    return null
  })

  const data = React.useMemo(() => [...searchedWalletList, ...createWalletList], [searchedWalletList, createWalletList])

  const handleScroll = useSceneScrollHandler()

  const contentContainerStyle = useMemo(() => {
    return {
      paddingTop: insetStyle.paddingTop + theme.rem(0.5),
      paddingBottom: insetStyle.paddingBottom + theme.rem(0.5),
      paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
      paddingRight: insetStyle.paddingRight + theme.rem(0.5)
    }
  }, [insetStyle.paddingBottom, insetStyle.paddingLeft, insetStyle.paddingRight, insetStyle.paddingTop, theme])

  return (
    <AnimatedFlatList
      contentContainerStyle={contentContainerStyle}
      data={data}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      refreshControl={refreshControl}
      renderItem={renderRow}
      onScroll={handleScroll}
      scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
    />
  )
}

export const WalletListSwipeable = React.memo(WalletListSwipeableComponent)
