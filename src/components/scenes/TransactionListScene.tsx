import { EdgeCurrencyWallet, EdgeTokenId, EdgeTokenMap, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ListRenderItemInfo, Platform, RefreshControl, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { activateWalletTokens } from '../../actions/WalletActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useIconColor } from '../../hooks/useIconColor'
import { useTransactionList } from '../../hooks/useTransactionList'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomByCurrencyCode } from '../../selectors/DenominationSelectors'
import { FooterRender } from '../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase, WalletsTabSceneProps } from '../../types/routerTypes'
import { infoServerData } from '../../util/network'
import { calculateSpamThreshold, darkenHexColor, unixToLocaleDateTime, zeroString } from '../../util/utils'
import { InfoCardCarousel } from '../cards/InfoCardCarousel'
import { AccentColors } from '../common/DotsBackground'
import { EdgeAnim, fadeInDown10, MAX_LIST_ITEMS_ANIM } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { BuyCrypto } from '../themed/BuyCrypto'
import { ExplorerCard } from '../themed/ExplorerCard'
import { SearchFooter } from '../themed/SearchFooter'
import { EmptyLoader, SectionHeader, SectionHeaderCentered } from '../themed/TransactionListComponents'
import { TransactionListRow } from '../themed/TransactionListRow'
import { TransactionListTop } from '../themed/TransactionListTop'

export interface TransactionListParams {
  walletId: string
  walletName: string
  tokenId: EdgeTokenId
  countryCode?: string
}

type ListItem = EdgeTransaction | string | null
interface Props extends WalletsTabSceneProps<'transactionList'> {
  wallet: EdgeCurrencyWallet
}

function TransactionListComponent(props: Props) {
  const { navigation, route, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const { width: screenWidth } = useSafeAreaFrame()

  const tokenId = checkToken(route.params.tokenId, wallet.currencyConfig.allTokens)
  const { pluginId } = wallet.currencyInfo
  const { currencyCode } = tokenId == null ? wallet.currencyInfo : wallet.currencyConfig.allTokens[tokenId]

  // State:
  const flashListRef = React.useRef<Animated.FlatList<ListItem> | null>(null)
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')
  const iconColor = useIconColor({ pluginId, tokenId })
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  // Selectors:
  const exchangeDenom = getExchangeDenomByCurrencyCode(wallet.currencyConfig, currencyCode)
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${state.ui.settings.defaultIsoFiat}`])
  const spamFilterOn = useSelector(state => state.ui.settings.spamFilterOn)
  const activeUsername = useSelector(state => state.core.account.username)
  const isLightAccount = activeUsername == null

  // Watchers:
  const enabledTokenIds = useWatch(wallet, 'enabledTokenIds')
  const unactivatedTokenIds = useWatch(wallet, 'unactivatedTokenIds')

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const spamThreshold = React.useMemo<string | undefined>(() => {
    if (spamFilterOn && !zeroString(exchangeRate)) {
      return calculateSpamThreshold(exchangeRate, exchangeDenom)
    }
  }, [exchangeDenom, exchangeRate, spamFilterOn])

  // Transaction list state machine:
  const {
    transactions,
    atEnd,
    requestMore: handleScrollEnd
  } = useTransactionList(wallet, tokenId, {
    searchString: isSearching ? searchText : undefined,
    spamThreshold
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

  // TODO: Comment out sticky header indices until we figure out how to
  // give the headers a background only when they're sticking.
  // Figure out where the section headers are located:
  // const stickyHeaderIndices = React.useMemo<number[]>(() => {
  //   const out: number[] = []
  //   for (let i = 0; i < listItems.length; ++i) {
  //     if (typeof listItems[i] === 'string') out.push(i)
  //   }
  //   return out
  // }, [listItems])

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
    'TransactionListScene unactivatedTokenIds check'
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

  const topArea = React.useMemo(() => {
    return (
      <>
        <TransactionListTop
          isEmpty={listItems.length < 1}
          navigation={navigation}
          searching={isSearching}
          tokenId={tokenId}
          wallet={wallet}
          isLightAccount={isLightAccount}
          onSearchingChange={setIsSearching}
          onSearchTextChange={setSearchText}
        />
        <InfoCardCarousel
          enterAnim={fadeInDown10}
          cards={(infoServerData.rollup?.assetStatusCards2 ?? {})[`${pluginId}${tokenId == null ? '' : `_${tokenId}`}`]}
          navigation={navigation as NavigationBase}
          countryCode={route.params.countryCode}
          screenWidth={screenWidth}
        />
      </>
    )
  }, [listItems.length, navigation, isSearching, tokenId, wallet, isLightAccount, pluginId, route.params.countryCode, screenWidth])

  const emptyComponent = React.useMemo(() => {
    if (isTransactionListUnsupported) {
      return <ExplorerCard wallet={wallet} tokenId={tokenId} />
    } else if (isSearching) {
      return <SectionHeaderCentered title={lstrings.transaction_list_search_no_result} />
    } else {
      return <BuyCrypto countryCode={route.params.countryCode} navigation={navigation as NavigationBase} wallet={wallet} tokenId={tokenId} />
    }
  }, [isTransactionListUnsupported, isSearching, wallet, tokenId, route.params.countryCode, navigation])

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
        <TransactionListRow navigation={navigation as NavigationBase} transaction={item} wallet={wallet} />
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
          name="TransactionListScene-SearchFooter"
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

  const accentColors: AccentColors = {
    // Transparent fallback for while iconColor is loading
    iconAccentColor: iconColor ?? '#00000000'
  }

  const backgroundColors = [...theme.assetBackgroundGradientColors]
  if (iconColor != null) {
    const scaledColor = darkenHexColor(iconColor, theme.assetBackgroundColorScale)
    backgroundColors[0] = scaledColor
  }

  return (
    <SceneWrapper
      accentColors={accentColors}
      overrideDots={theme.backgroundDots.assetOverrideDots}
      avoidKeyboard
      footerHeight={footerHeight}
      hasTabs
      hasNotifications
      backgroundGradientColors={backgroundColors}
      backgroundGradientEnd={theme.assetBackgroundGradientEnd}
      backgroundGradientStart={theme.assetBackgroundGradientStart}
      renderFooter={renderFooter}
    >
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
            ListHeaderComponent={topArea}
            onEndReachedThreshold={0.5}
            renderItem={renderItem}
            // TODO: Comment out sticky header indices until we figure out how to
            // give the headers a background only when they're sticking.
            // stickyHeaderIndices={stickyHeaderIndices}
            onEndReached={handleScrollEnd}
            onScroll={handleScroll}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
            // Android scroll gestures break without refreshControl given the
            // combination of props we use on this Animated.FlatList.
            refreshControl={refreshControl}
          />
        </View>
      )}
    </SceneWrapper>
  )
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
    overflow: 'visible',
    flexShrink: 0
  }
}))
