import * as React from 'react'
import { FlatList, RefreshControl } from 'react-native'

import { selectWallet } from '../../actions/WalletActions'
import { useHandler } from '../../hooks/useHandler'
import { useRowLayout } from '../../hooks/useRowLayout'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { searchWalletList } from '../services/SortedWalletList'
import { useTheme } from '../services/ThemeContext'
import { filterWalletCreateItemListBySearchText, getCreateWalletList, WalletCreateItem } from './WalletList'
import { WalletListCreateRow } from './WalletListCreateRow'
import { WalletListSwipeableCurrencyRow } from './WalletListSwipeableCurrencyRow'
import { WalletListSwipeableLoadingRow } from './WalletListSwipeableLoadingRow'

type Props = {
  footer?: React.ComponentType<{}> | React.ReactElement
  header?: React.ComponentType<{}> | React.ReactElement
  navigation: NavigationProp<'walletList'>
  searching: boolean
  searchText: string
  showSlidingTutorial?: boolean

  // Callbacks:
  onRefresh?: () => void
  onReset?: () => void
}

/**
 * The main wallet list used in a scene.
 */
export function WalletListSwipeable(props: Props) {
  const {
    footer,
    header,
    navigation,
    searching,
    searchText,
    showSlidingTutorial,

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
    dispatch(selectWallet(walletId, currencyCode))
      .then(() => navigation.navigate('transactionList', {}))
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
        />
      )
    }

    const { token, tokenId, wallet, walletId } = item.item

    if (wallet != null) {
      return (
        <WalletListSwipeableCurrencyRow
          navigation={navigation}
          openTutorial={item.index === 0 && showSlidingTutorial}
          token={token}
          tokenId={tokenId}
          wallet={wallet}
        />
      )
    }
    if (walletId != null) {
      return <WalletListSwipeableLoadingRow navigation={navigation} walletId={walletId} />
    }
    return null
  })

  const handleItemLayout = useRowLayout()

  return (
    <FlatList
      contentOffset={{ x: 0, y: searching ? 0 : theme.rem(4.5) }}
      data={[...searchedWalletList, ...createWalletList]}
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      refreshControl={refreshControl}
      renderItem={renderRow}
      getItemLayout={handleItemLayout}
    />
  )
}
