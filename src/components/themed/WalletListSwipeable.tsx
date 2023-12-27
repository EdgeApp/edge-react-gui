import * as React from 'react'
import { FlatList, RefreshControl } from 'react-native'

import { selectWalletToken } from '../../actions/WalletActions'
import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { getTokenIdForced } from '../../util/CurrencyInfoHelpers'
import { EdgeAnim } from '../common/EdgeAnim'
import { InsetStyles } from '../common/SceneWrapper'
import { searchWalletList } from '../services/SortedWalletList'
import { useTheme } from '../services/ThemeContext'
import { filterWalletCreateItemListBySearchText, getCreateWalletList, WalletCreateItem } from './WalletList'
import { WalletListCreateRow } from './WalletListCreateRow'
import { WalletListSwipeableCurrencyRow } from './WalletListSwipeableCurrencyRow'
import { WalletListSwipeableLoadingRow } from './WalletListSwipeableLoadingRow'

interface Props {
  footer?: React.ComponentType<{}> | React.ReactElement
  header?: React.ComponentType<{}> | React.ReactElement
  navigation: NavigationProp<'walletList'>
  searching: boolean
  searchText: string
  insetStyles?: InsetStyles

  // Callbacks:
  onRefresh?: () => void
  onReset?: () => void
}

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
    insetStyles,

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

  const handleCreateWallet = useHandler(async (walletId, currencyCode) => {
    const wallet = account.currencyWallets[walletId]
    const tokenId = getTokenIdForced(account, wallet.currencyInfo.pluginId, currencyCode)
    dispatch(selectWalletToken({ navigation, walletId, tokenId }))
      .then(() => navigation.navigate('transactionList', { walletId, tokenId }))
      .finally(onReset)
  })

  // Filter based on the search text:
  const searchedWalletList = React.useMemo(() => searchWalletList(sortedWalletList, searching, searchText), [sortedWalletList, searching, searchText])

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
      const { currencyCode, displayName, pluginId, walletType, createWalletIds } = createItem
      return (
        <WalletListCreateRow
          currencyCode={currencyCode}
          currencyName={displayName}
          pluginId={pluginId}
          walletType={walletType}
          onPress={handleCreateWallet}
          createWalletIds={createWalletIds}
          trackingEventFailed="Create_Wallet_From_Search_Failed"
          trackingEventSuccess="Create_Wallet_From_Search_Success"
        />
      )
    }

    const { token, tokenId, wallet, walletId } = item.item

    if (wallet != null) {
      return (
        <EdgeAnim enter={{ type: 'fadeInRight', distance: 20 * (index + 1) }}>
          <WalletListSwipeableCurrencyRow navigation={navigation} token={token} tokenId={tokenId} wallet={wallet} />
        </EdgeAnim>
      )
    }
    if (walletId != null) {
      return (
        <EdgeAnim enter={{ type: 'fadeInRight', distance: 20 * (index + 1) }}>
          <WalletListSwipeableLoadingRow navigation={navigation} walletId={walletId} />
        </EdgeAnim>
      )
    }
    return null
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const flatListContentOffset = React.useMemo(() => ({ x: 0, y: searching ? 0 : theme.rem(4.5) }), [searching])
  const data = React.useMemo(() => [...searchedWalletList, ...createWalletList], [searchedWalletList, createWalletList])

  return (
    <FlatList
      contentOffset={flatListContentOffset}
      contentContainerStyle={insetStyles}
      data={data}
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      refreshControl={refreshControl}
      renderItem={renderRow}
    />
  )
}

export const WalletListSwipeable = React.memo(WalletListSwipeableComponent)
