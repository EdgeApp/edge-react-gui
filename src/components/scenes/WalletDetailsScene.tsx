import { useRoute } from '@react-navigation/native'
import { gt, mul } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId, EdgeTokenMap, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Platform, RefreshControl, View } from 'react-native'
import Reanimated from 'react-native-reanimated'
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { sprintf } from 'sprintf-js'

import { activateWalletTokens } from '../../actions/WalletActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useIconColor } from '../../hooks/useIconColor'
import { useTransactionList } from '../../hooks/useTransactionList'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomByCurrencyCode } from '../../selectors/DenominationSelectors'
import { getExchangeRate } from '../../selectors/WalletSelectors'
import { FooterRender } from '../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase, RouteProp, WalletsTabSceneProps } from '../../types/routerTypes'
import { coinrankListData, infoServerData } from '../../util/network'
import { calculateSpamThreshold, convertNativeToDenomination, darkenHexColor } from '../../util/utils'
import { EdgeCard } from '../cards/EdgeCard'
import { InfoCardCarousel } from '../cards/InfoCardCarousel'
import { SwipeChart } from '../charts/SwipeChart'
import { DividerLineUi4 } from '../common/DividerLineUi4'
import { AccentColors } from '../common/DotsBackground'
import { fadeInDown10 } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader as SectionHeaderUi4 } from '../common/SectionHeader'
import { withWallet } from '../hoc/withWallet'
import { HeaderTitle } from '../navigation/HeaderTitle'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { BuyCrypto } from '../themed/BuyCrypto'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { ExplorerCard } from '../themed/ExplorerCard'
import { SearchFooter } from '../themed/SearchFooter'
import { EmptyLoader } from '../themed/TransactionListComponents'
import { TransactionView } from '../themed/TransactionListRow'
import { TransactionListTop } from '../themed/TransactionListTop'

export interface WalletDetailsParams {
  walletId: string
  tokenId: EdgeTokenId
}

interface Props extends WalletsTabSceneProps<'walletDetails'> {
  wallet: EdgeCurrencyWallet
}

function WalletDetailsComponent(props: Props) {
  const { navigation, route, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const { width: screenWidth } = useSafeAreaFrame()

  const tokenId = checkToken(route.params.tokenId, wallet.currencyConfig.allTokens)
  const { pluginId } = wallet.currencyInfo
  const { currencyCode, displayName } = tokenId == null ? wallet.currencyInfo : wallet.currencyConfig.allTokens[tokenId]

  const educationCards = (infoServerData.rollup?.assetInfoCards ?? {})[`${pluginId}${tokenId == null ? '' : `_${tokenId}`}`] ?? []

  // State:
  const scrollViewRef = React.useRef<AnimatedScrollView>(null)
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')
  const iconColor = useIconColor({ pluginId, tokenId })
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  // Selectors:
  const exchangeDenom = getExchangeDenomByCurrencyCode(wallet.currencyConfig, currencyCode)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const defaultFiat = defaultIsoFiat.replace('iso:', '')
  const exchangeRate = useSelector(state => getExchangeRate(state, currencyCode, defaultIsoFiat))
  const spamFilterOn = useSelector(state => state.ui.settings.spamFilterOn)
  const activeUsername = useSelector(state => state.core.account.username)
  const isLightAccount = activeUsername == null

  // Watchers:
  const enabledTokenIds = useWatch(wallet, 'enabledTokenIds')
  const unactivatedTokenIds = useWatch(wallet, 'unactivatedTokenIds')

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  // Fiat Balance Formatting
  // Note that we use the user's preferred fiat here,
  // which may differ from the coingeckoFiat used on the chart itself.
  const exchangeAmount = convertNativeToDenomination(exchangeDenom.multiplier)(exchangeDenom.multiplier)
  const fiatRate = mul(exchangeAmount, exchangeRate ?? 0)
  const fiatRateFormat = `${formatNumber(fiatRate && gt(fiatRate, '0.000001') ? fiatRate : 0, {
    toFixed: gt(fiatRate, '1000') ? 0 : 2
  })} ${defaultFiat}/${currencyCode}`

  const spamThreshold = React.useMemo<string | undefined>(() => {
    if (spamFilterOn) {
      return calculateSpamThreshold(exchangeRate, exchangeDenom)
    }
  }, [exchangeDenom, exchangeRate, spamFilterOn])

  // Transaction list state machine:
  const { transactions, atEnd } = useTransactionList(wallet, tokenId, {
    searchString: isSearching ? searchText : undefined,
    spamThreshold
  })

  const { isTransactionListUnsupported = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}

  // Assemble the data for the section list:
  const listItems = React.useMemo(() => {
    if (isTransactionListUnsupported) return []

    // Take only the 5 most recent transactions
    const recentTransactions = transactions.slice(0, 5)
    return recentTransactions.length > 0 ? recentTransactions : []
  }, [isTransactionListUnsupported, transactions])

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

  const handleContentSizeChange = useHandler(() => {
    if (isSearching) scrollViewRef.current?.scrollToEnd()
  })

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

  const assetId = coinrankListData.coins[currencyCode]

  const handlePressCoinRanking = useHandler(() => {
    navigation.navigate('coinRankingDetails', { assetId })
  })

  const handlePressSeeAll = useHandler(() => {
    navigation.navigate('transactionList', {
      ...route.params,
      searchText: isSearching ? searchText : undefined
    })
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
        <Reanimated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            paddingTop: insetStyle.paddingTop + theme.rem(0.5),
            paddingBottom: insetStyle.paddingBottom + theme.rem(0.5),
            paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
            paddingRight: insetStyle.paddingRight + theme.rem(0.5)
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          // Android scroll gestures break without refreshControl given the
          // combination of props we use on this ScrollView:
          refreshControl={refreshControl}
          // Fixes middle-floating scrollbar issue
          scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          style={undoInsetStyle}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
        >
          <TransactionListTop
            isEmpty={listItems.length < 1}
            navigation={navigation}
            searching={isSearching}
            tokenId={tokenId}
            wallet={wallet}
            isLightAccount={isLightAccount}
          />
          <DividerLineUi4 extendRight />
          <InfoCardCarousel
            enterAnim={fadeInDown10}
            cards={(infoServerData.rollup?.assetStatusCards2 ?? {})[`${pluginId}${tokenId == null ? '' : `_${tokenId}`}`]}
            navigation={navigation as NavigationBase}
            screenWidth={screenWidth}
          />
          {assetId != null && <SectionHeaderUi4 leftTitle={displayName} rightNode={lstrings.coin_rank_see_more} onRightPress={handlePressCoinRanking} />}
          {assetId != null && (
            <EdgeCard>
              <Paragraph>
                <EdgeText>{fiatRateFormat}</EdgeText>
              </Paragraph>
              <SwipeChart assetId={assetId} />
            </EdgeCard>
          )}
          <SectionHeaderUi4
            leftTitle={lstrings.transaction_list_recent_transactions}
            rightNode={listItems.length === 0 ? null : lstrings.see_all}
            onRightPress={handlePressSeeAll}
          />
          <View style={styles.txListContainer}>
            {listItems.length > 0 ? (
              <EdgeCard sections>
                {listItems.map((tx: EdgeTransaction) => (
                  <TransactionView key={tx.txid} navigation={navigation as NavigationBase} transaction={tx} wallet={wallet} />
                ))}
              </EdgeCard>
            ) : listItems.length === 0 && !atEnd ? (
              <EmptyLoader />
            ) : isTransactionListUnsupported ? (
              <ExplorerCard wallet={wallet} tokenId={tokenId} />
            ) : isSearching ? (
              <EdgeText style={styles.noResultsText}>{lstrings.transaction_list_search_no_result}</EdgeText>
            ) : (
              <BuyCrypto navigation={navigation as NavigationBase} wallet={wallet} tokenId={tokenId} />
            )}
          </View>
          {educationCards.length === 0 ? null : (
            <>
              <DividerLineUi4 extendRight />
              <SectionHeaderUi4 leftTitle={config.appName === 'Edge' ? lstrings.edge_ucation : lstrings.education} />
              <InfoCardCarousel enterAnim={fadeInDown10} cards={educationCards} navigation={navigation as NavigationBase} screenWidth={screenWidth} />
            </>
          )}
        </Reanimated.ScrollView>
      )}
    </SceneWrapper>
  )
}

export const WalletDetailsTitle = (params: { customTitle?: string }) => {
  const route = useRoute<RouteProp<'walletDetails'>>()
  const account = useSelector(state => state.core.account)
  const wallet = account.currencyWallets[route.params.walletId]
  const title = sprintf(lstrings.create_wallet_account_metadata_name, wallet?.currencyInfo.displayName)
  return <HeaderTitle title={title} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  txListContainer: {
    // A bit less than 5 transaction rows:
    minHeight: theme.rem(20)
  },
  noResultsText: {
    alignSelf: 'center',
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.25),
    paddingVertical: theme.rem(2)
  }
}))

/**
 * If the token gets deleted, the scene will crash.
 * Fall back to the main currency code if this happens.
 */
function checkToken(tokenId: EdgeTokenId, allTokens: EdgeTokenMap): EdgeTokenId {
  if (tokenId == null) return null
  if (allTokens[tokenId] == null) return null
  return tokenId
}

export const WalletDetails = withWallet(WalletDetailsComponent)
