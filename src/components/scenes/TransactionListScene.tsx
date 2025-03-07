import { useRoute } from '@react-navigation/native'
import { EdgeCurrencyWallet, EdgeTokenId, EdgeTokenMap, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ListRenderItemInfo, Platform, RefreshControl, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { activateWalletTokens } from '../../actions/WalletActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useTransactionList } from '../../hooks/useTransactionList'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { FooterRender } from '../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase, RouteProp, WalletsTabSceneProps } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { unixToLocaleDateTime } from '../../util/utils'
import { EdgeAnim, MAX_LIST_ITEMS_ANIM } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { HeaderTitle } from '../navigation/HeaderTitle'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { ExplorerCard } from '../themed/ExplorerCard'
import { SearchFooter } from '../themed/SearchFooter'
import { EmptyLoader, SectionHeader, SectionHeaderCentered } from '../themed/TransactionListComponents'
import { TransactionCard } from '../themed/TransactionListRow'

export interface TransactionListParams {
  walletId: string
  tokenId: EdgeTokenId
  searchText?: string
}

type ListItem = EdgeTransaction | string | null
interface Props extends WalletsTabSceneProps<'transactionList'> {
  wallet: EdgeCurrencyWallet
}

function TransactionListComponent(props: Props) {
  const { navigation, route, wallet } = props
  const { searchText: initSearchText } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const tokenId = checkToken(route.params.tokenId, wallet.currencyConfig.allTokens)
  const { pluginId } = wallet.currencyInfo

  // State:
  const flashListRef = React.useRef<Animated.FlatList<ListItem> | null>(null)
  const [isSearching, setIsSearching] = React.useState(initSearchText != null)
  const [searchText, setSearchText] = React.useState(initSearchText ?? '')
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  // Watchers:
  const enabledTokenIds = useWatch(wallet, 'enabledTokenIds')
  const unactivatedTokenIds = useWatch(wallet, 'unactivatedTokenIds')

  // Transaction list state machine:
  const {
    transactions,
    atEnd,
    requestMore: handleScrollEnd
  } = useTransactionList(wallet, tokenId, {
    searchString: isSearching ? searchText : undefined
  })

  const { isTransactionListUnsupported = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}

  // Assemble the data for the section list:
  const listItems = React.useMemo(() => {
    if (isTransactionListUnsupported) return []

    let lastSection = ''
    const out: ListItem[] = []
    for (const tx of transactions) {
      // Create a new section header if we need one:
      const { date } = unixToLocaleDateTime(tx.date)
      if (date !== lastSection) {
        out.push(date)
        lastSection = date
      }

      // Add the transaction to the list:
      out.push(tx)
    }

    // If we are still loading, add a spinner at the end:
    if (!atEnd) out.push(null)

    return out
  }, [atEnd, isTransactionListUnsupported, transactions])

  // ---------------------------------------------------------------------------
  // Side-Effects
  // ---------------------------------------------------------------------------

  // Navigate back if the token is disabled from Archive Wallet action
  React.useEffect(() => {
    if (tokenId != null && !enabledTokenIds.includes(tokenId)) {
      navigation.goBack()
    }
  }, [enabledTokenIds, navigation, tokenId])

  // Automatically navigate to the token activation confirmation scene if
  // the token appears in the unactivatedTokenIds list once the wallet loads
  // this state.
  useAsyncEffect(
    async () => {
      if (unactivatedTokenIds.length > 0) {
        if (unactivatedTokenIds.some(unactivatedTokenId => unactivatedTokenId === tokenId)) {
          await dispatch(activateWalletTokens(navigation as NavigationBase, wallet, [tokenId]))
        }
      }
    },
    [unactivatedTokenIds],
    'TransactionListScene2 unactivatedTokenIds check'
  )

  //
  // Handlers
  //

  const handleScroll = useSceneScrollHandler()

  const handleStartSearching = useHandler(() => {
    setIsSearching(true)
  })

  const handleDoneSearching = useHandler(() => {
    setSearchText('')
    setIsSearching(false)
  })

  const handleChangeText = useHandler((value: string) => {
    setSearchText(value)
  })

  const handleFooterLayoutHeight = useHandler((height: number) => {
    setFooterHeight(height)
  })

  //
  // Renderers
  //

  /**
   * HACK: This `RefreshControl` doesn't actually do anything visually or
   * functionally noticeable besides making Android scroll gestures actually
   * work for the parent `Animated.FlatList`
   */
  const refreshControl = React.useMemo(() => {
    return Platform.OS === 'ios' ? undefined : (
      <RefreshControl
        refreshing={false}
        enabled={false}
        style={{ opacity: 0 }}
        // useHandler isn't needed, since we're already in useMemo:
        onRefresh={() => {}}
      />
    )
  }, [])

  const emptyComponent = React.useMemo(() => {
    if (isTransactionListUnsupported) {
      return <ExplorerCard wallet={wallet} tokenId={tokenId} />
    } else if (isSearching) {
      return <SectionHeaderCentered title={lstrings.transaction_list_search_no_result} />
    }
    return null
  }, [isTransactionListUnsupported, isSearching, wallet, tokenId])

  const renderItem = useHandler(({ index, item }: ListRenderItemInfo<ListItem>) => {
    if (item == null) {
      return <EmptyLoader />
    }

    const disableAnimation = index >= MAX_LIST_ITEMS_ANIM
    if (typeof item === 'string') {
      return (
        <EdgeAnim disableAnimation={disableAnimation} enter={{ type: 'fadeInDown', distance: 30 * (index + 1) }}>
          <SectionHeader title={item} />
        </EdgeAnim>
      )
    }
    return (
      <EdgeAnim disableAnimation={disableAnimation} enter={{ type: 'fadeInDown', distance: 30 * (index + 1) }}>
        <TransactionCard navigation={navigation as NavigationBase} transaction={item} wallet={wallet} />
      </EdgeAnim>
    )
  })

  const keyExtractor = useHandler((item: ListItem) => {
    if (item == null) return 'spinner'
    if (typeof item === 'string') return item
    return item.txid
  })

  const renderFooter: FooterRender = React.useCallback(
    sceneWrapperInfo => {
      return (
        <SearchFooter
          name="TransactionListScene2-SearchFooter"
          placeholder={lstrings.transaction_list_search}
          isSearching={isSearching}
          searchText={searchText}
          noBackground
          sceneWrapperInfo={sceneWrapperInfo}
          onStartSearching={handleStartSearching}
          onDoneSearching={handleDoneSearching}
          onChangeText={handleChangeText}
          onLayoutHeight={handleFooterLayoutHeight}
        />
      )
    },
    [handleChangeText, handleDoneSearching, handleFooterLayoutHeight, handleStartSearching, isSearching, searchText]
  )

  return (
    <SceneWrapper avoidKeyboard footerHeight={footerHeight} hasTabs hasNotifications renderFooter={renderFooter}>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={undoInsetStyle}>
          <Animated.FlatList
            style={styles.flatList}
            ref={flashListRef}
            contentContainerStyle={{
              paddingTop: insetStyle.paddingTop + theme.rem(0.5),
              paddingBottom: insetStyle.paddingBottom + theme.rem(0.5),
              paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
              paddingRight: insetStyle.paddingRight + theme.rem(0.5)
            }}
            data={listItems}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            ListEmptyComponent={emptyComponent}
            onEndReachedThreshold={0.5}
            renderItem={renderItem}
            onEndReached={handleScrollEnd}
            onScroll={handleScroll}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
            refreshControl={refreshControl}
          />
        </View>
      )}
    </SceneWrapper>
  )
}

export const TransactionListTitle = () => {
  const route = useRoute<RouteProp<'walletDetails'>>()
  const account = useSelector(state => state.core.account)
  const wallet = account.currencyWallets[route.params.walletId]
  const title = wallet == null ? '' : getWalletName(wallet)
  return <HeaderTitle title={title} />
}

/**
 * If the token gets deleted, the scene will crash.
 * Fall back to the main currency code if this happens.
 */
function checkToken(tokenId: EdgeTokenId, allTokens: EdgeTokenMap): EdgeTokenId {
  if (tokenId == null) return null
  if (allTokens[tokenId] == null) return null
  return tokenId
}

export const TransactionList = withWallet(TransactionListComponent)

const getStyles = cacheStyles(() => ({
  flatList: {
    flex: 1
  }
}))
