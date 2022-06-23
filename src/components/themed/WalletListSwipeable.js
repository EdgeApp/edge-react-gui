// @flow

import { useCavy } from 'cavy'
import * as React from 'react'
import { RefreshControl } from 'react-native'

import { useHandler } from '../../hooks/useHandler.js'
import { useMemo } from '../../types/reactHooks.js'
import { FlatList } from '../../types/reactNative.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { type FlatListItem, type WalletListItem } from '../../types/types.js'
import { searchWalletList } from '../services/SortedWalletList.js'
import { useTheme } from '../services/ThemeContext.js'
import { WalletListSwipeableCurrencyRow } from './WalletListSwipeableCurrencyRow.js'
import { WalletListSwipeableLoadingRow } from './WalletListSwipeableLoadingRow.js'

type Props = {|
  footer?: React.Node,
  header?: React.Node,
  navigation: NavigationProp<'walletList'>,
  searching: boolean,
  searchText: string,
  showSlidingTutorial?: boolean,

  // Callbacks:
  onRefresh?: () => void
|}

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
    onRefresh
  } = props

  // Subscriptions:
  const theme = useTheme()
  const sortedWalletList = useSelector(state => state.sortedWalletList)
  const generateTestHook = useCavy()
  // Filter based on the search text:
  const searchedWalletList = useMemo(() => searchWalletList(sortedWalletList, searching, searchText), [sortedWalletList, searching, searchText])

  // Render the refresh control:
  const refreshControl = useMemo(() => {
    if (onRefresh == null) return null
    return <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.searchListRefreshControlIndicator} />
  }, [theme, onRefresh])

  // Renders a single row:
  const renderRow = useHandler((item: FlatListItem<WalletListItem>) => {
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

  return (
    <FlatList
      contentOffset={{ x: 0, y: searching ? 0 : theme.rem(4.5) }}
      data={searchedWalletList}
      keyboardShouldPersistTaps="handled"
      keyExtractor={keyExtractor}
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      refreshControl={refreshControl}
      renderItem={renderRow}
      ref={generateTestHook('WalletListSwipeable.WalletId')}
    />
  )
}

function keyExtractor(item: WalletListItem): string {
  return item.key
}
