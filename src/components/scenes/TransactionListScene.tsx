import { abs, lt } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId, EdgeTokenMap, EdgeTransaction } from 'edge-core-js'
import { AssetStatus } from 'edge-info-server'
import * as React from 'react'
import { ListRenderItemInfo, RefreshControl, View } from 'react-native'
import { getVersion } from 'react-native-device-info'
import Animated from 'react-native-reanimated'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useIconColor } from '../../hooks/useIconColor'
import { useTransactionList } from '../../hooks/useTransactionList'
import { useWatch } from '../../hooks/useWatch'
import { getLocaleOrDefaultString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomByCurrencyCode } from '../../selectors/DenominationSelectors'
import { FooterRender } from '../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { infoServerData } from '../../util/network'
import { calculateSpamThreshold, darkenHexColor, unixToLocaleDateTime, zeroString } from '../../util/utils'
import { AssetStatusCard } from '../cards/AssetStatusCard'
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
}

type ListItem = EdgeTransaction | string | null
interface Props extends EdgeSceneProps<'transactionList'> {
  wallet: EdgeCurrencyWallet
}

function TransactionListComponent(props: Props) {
  const { navigation, route, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)

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
  const transactionList = useTransactionList(wallet, tokenId, isSearching ? searchText : undefined)
  const { transactions, atEnd, requestMore: handleScrollEnd } = transactionList

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const spamThreshold = React.useMemo<string | undefined>(() => {
    if (spamFilterOn && !zeroString(exchangeRate)) {
      return calculateSpamThreshold(exchangeRate, exchangeDenom)
    }
  }, [exchangeDenom, exchangeRate, spamFilterOn])

  const { isTransactionListUnsupported = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}

  // Assemble the data for the section list:
  const listItems = React.useMemo(() => {
    if (isTransactionListUnsupported) return []

    let lastSection = ''
    const out: ListItem[] = []
    for (const tx of transactions) {
      // Skip spam transactions:
      if (!tx.isSend && spamThreshold != null && lt(abs(tx.nativeAmount), spamThreshold)) {
        continue
      }

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
  }, [atEnd, isTransactionListUnsupported, spamThreshold, transactions])

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

  // Check for AssetStatuses from info server (known sync issues, etc):
  const assetStatuses = React.useMemo<AssetStatus[]>(() => {
    const pluginTokenId = `${pluginId}${tokenId == null ? '' : `_${tokenId}`}`
    const allAssetStatuses = (infoServerData.rollup?.assetStatusCards ?? {})[pluginTokenId] ?? []
    const version = getVersion()
    return allAssetStatuses.filter(assetStatus => {
      const { appId, appVersions, localeStatusBody, localeStatusTitle, statusStartIsoDate, statusEndIsoDate } = assetStatus
      const curDate = new Date().toISOString()

      const title = getLocaleOrDefaultString(localeStatusTitle)
      const message = getLocaleOrDefaultString(localeStatusBody)

      if (title == null || message == null) return false
      if (appId != null && appId !== config.appId) return false
      if (appVersions != null && !appVersions.includes(version)) return false
      if (statusEndIsoDate != null && statusEndIsoDate < curDate) return false
      if (statusStartIsoDate != null && statusStartIsoDate > curDate) return false
      return true
    })
  }, [pluginId, tokenId])

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

  const refreshControl = React.useMemo(() => {
    return (
      <RefreshControl
        refreshing={false}
        tintColor={theme.searchListRefreshControlIndicator}
        // useHandler isn't needed, since we're already in useMemo:
        onRefresh={() => setIsSearching(true)}
      />
    )
  }, [theme])

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
        {assetStatuses.length > 0 && !isSearching
          ? assetStatuses.map(assetStatus => (
              <EdgeAnim enter={fadeInDown10} key={`${String(assetStatus.localeStatusTitle)}-${String(assetStatus.localeStatusBody)}`}>
                <AssetStatusCard assetStatus={assetStatus} key={`${String(assetStatus.localeStatusTitle)}-${String(assetStatus.localeStatusBody)}`} />
              </EdgeAnim>
            ))
          : null}
      </>
    )
  }, [assetStatuses, isLightAccount, listItems.length, navigation, isSearching, tokenId, wallet])

  const emptyComponent = React.useMemo(() => {
    if (isTransactionListUnsupported) {
      return <ExplorerCard wallet={wallet} tokenId={tokenId} />
    } else if (isSearching) {
      return <SectionHeaderCentered title={lstrings.transaction_list_search_no_result} />
    } else {
      return <BuyCrypto navigation={navigation} wallet={wallet} tokenId={tokenId} />
    }
  }, [isTransactionListUnsupported, navigation, isSearching, tokenId, wallet])

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
        <TransactionListRow navigation={navigation} transaction={item} wallet={wallet} />
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
            refreshControl={refreshControl}
            renderItem={renderItem}
            // TODO: Comment out sticky header indices until we figure out how to
            // give the headers a background only when they're sticking.
            // stickyHeaderIndices={stickyHeaderIndices}
            onEndReached={handleScrollEnd}
            onScroll={handleScroll}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
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
