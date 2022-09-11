import * as React from 'react'
import { FlatList, RefreshControl } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { useRowLayout } from '../../hooks/useRowLayout'
import { useMemo } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { FlatListItem, WalletListItem } from '../../types/types'
import { searchWalletList } from '../services/SortedWalletList'
import { useTheme } from '../services/ThemeContext'
import { WalletListSwipeableCurrencyRow } from './WalletListSwipeableCurrencyRow'
import { WalletListSwipeableLoadingRow } from './WalletListSwipeableLoadingRow'

type Props = {
  footer?: React.ReactNode
  header?: React.ReactNode
  navigation: NavigationProp<'walletList'>
  searching: boolean
  searchText: string
  showSlidingTutorial?: boolean

  // Callbacks:
  onRefresh?: () => void
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
    onRefresh
  } = props

  // Subscriptions:
  const theme = useTheme()
  // @ts-expect-error
  const sortedWalletList = useSelector(state => state.sortedWalletList)

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

  const handleItemLayout = useRowLayout()

  return (
    // @ts-expect-error
    <FlatList
      contentOffset={{ x: 0, y: searching ? 0 : theme.rem(4.5) }}
      data={searchedWalletList}
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      refreshControl={refreshControl}
      renderItem={renderRow}
      getItemLayout={handleItemLayout}
    />
  )
}
