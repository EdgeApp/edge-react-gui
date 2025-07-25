import * as React from 'react'
import { ListRenderItemInfo, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { checkEnabledExchanges } from '../../actions/SettingsActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useAbortable } from '../../hooks/useAbortable'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getCoingeckoFiat } from '../../selectors/SettingsSelectors'
import { FooterRender } from '../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import {
  asCoinranking,
  AssetSubText,
  CoinRanking,
  PercentChangeTimeFrame
} from '../../types/coinrankTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { debugLog, enableDebugLogType, LOG_COINRANK } from '../../util/logger'
import { fetchRates } from '../../util/network'
import { EdgeAnim, MAX_LIST_ITEMS_ANIM } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { FillLoader } from '../progress-indicators/FillLoader'
import { CoinRankRow } from '../rows/CoinRankRow'
import { showDevError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { SearchFooter } from '../themed/SearchFooter'

const coinRanking: CoinRanking = { coinRankingDatas: [] }

/**
 * Track changes that occurred to fiat while scene is unmounted. Don't react to
 * changes to this value.
 */
let lastSceneFiat: string

const QUERY_PAGE_SIZE = 30
const LISTINGS_REFRESH_INTERVAL = 30000

// Masking enable bit with 0 disables logging
enableDebugLogType(LOG_COINRANK & 0)

interface Props extends EdgeAppSceneProps<'coinRanking'> {}

const percentChangeOrder: PercentChangeTimeFrame[] = [
  'hours1',
  'hours24',
  'days7',
  'days30',
  'year1'
]
const percentChangeStrings: { [pc: string]: string } = {
  hours1: '1hr',
  hours24: '24hr',
  days7: '7d',
  days30: '30d',
  year1: '1y'
}
const assetSubTextStrings: { [pc: string]: string } = {
  marketCap: lstrings.coin_rank_market_cap_abbreviation,
  volume24h: lstrings.coin_rank_volume_24hr_abbreviation
}

const CoinRankingComponent = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { navigation } = props
  const dispatch = useDispatch()

  const { coinRankingDatas } = coinRanking

  const lastStartIndex = React.useRef<number>(1)

  const [requestDataSize, setRequestDataSize] =
    React.useState<number>(QUERY_PAGE_SIZE)
  const [dataSize, setDataSize] = React.useState<number>(
    coinRankingDatas.length
  )
  const [searchText, setSearchText] = React.useState<string>('')
  const [isSearching, setIsSearching] = React.useState<boolean>(false)
  const [percentChangeTimeFrame, setPercentChangeTimeFrame] =
    React.useState<PercentChangeTimeFrame>('hours24')
  const [assetSubText, setPriceSubText] =
    React.useState<AssetSubText>('marketCap')
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  /** The user's fiat setting, falling back to USD if not supported. */
  const coingeckoFiat = useSelector(state => {
    const currentCoinGeckoFiat = getCoingeckoFiat(state)
    if (lastSceneFiat == null) {
      lastSceneFiat = currentCoinGeckoFiat
    }

    // Whenever we see a different fiat, clear the cache. We want to do this
    // here as close to the site of the state change as possible to ensure this
    // happens before anything else.
    if (lastSceneFiat != null && currentCoinGeckoFiat !== lastSceneFiat) {
      debugLog(LOG_COINRANK, 'clearing cache')
      lastSceneFiat = currentCoinGeckoFiat
      coinRanking.coinRankingDatas = []
    }
    return currentCoinGeckoFiat
  })

  const handleScroll = useSceneScrollHandler()

  const extraData = React.useMemo(
    () => ({
      assetSubText,
      supportedFiatSetting: coingeckoFiat,
      percentChangeTimeFrame
    }),
    [assetSubText, coingeckoFiat, percentChangeTimeFrame]
  )

  const renderItem = (itemObj: ListRenderItemInfo<number>) => {
    const { index, item } = itemObj
    const currencyCode =
      coinRankingDatas[index]?.currencyCode ?? 'NO_CURRENCY_CODE'
    const rank = coinRankingDatas[index]?.rank ?? 'NO_RANK'
    const key = `${index}-${item}-${rank}-${currencyCode}-${coingeckoFiat}`
    debugLog(LOG_COINRANK, `renderItem ${key.toString()}`)

    return (
      <EdgeAnim
        key={key}
        disableAnimation={index >= MAX_LIST_ITEMS_ANIM}
        enter={{ type: 'fadeInDown', distance: 20 * (index + 1) }}
      >
        <CoinRankRow
          navigation={navigation}
          index={item}
          coinRanking={coinRanking}
          percentChangeTimeFrame={percentChangeTimeFrame}
          assetSubText={assetSubText}
          fiatCurrencyCode={coingeckoFiat}
        />
      </EdgeAnim>
    )
  }

  const handleEndReached = useHandler(() => {
    debugLog(
      LOG_COINRANK,
      `handleEndReached. setRequestDataSize ${
        requestDataSize + QUERY_PAGE_SIZE
      }`
    )
    setRequestDataSize(requestDataSize + QUERY_PAGE_SIZE)
  })

  const handlePercentChange = useHandler(() => {
    const index = percentChangeOrder.indexOf(percentChangeTimeFrame)
    if (index < 0) {
      const msg = `Invalid percent change value ${percentChangeTimeFrame}`
      console.error(msg)
      showDevError(msg)
      return
    }
    const newIndex = index + 1 >= percentChangeOrder.length ? 0 : index + 1
    const newTimeFrame = percentChangeOrder[newIndex]
    setPercentChangeTimeFrame(newTimeFrame)
  })

  const handlePriceSubText = useHandler(() => {
    const newPriceSubText =
      assetSubText === 'marketCap' ? 'volume24h' : 'marketCap'
    setPriceSubText(newPriceSubText)
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

  React.useEffect(() => {
    return navigation.addListener('focus', () => {
      dispatch(checkEnabledExchanges())
    })
  }, [dispatch, navigation])

  // Start querying starting from either the last fetched index (scrolling) or
  // the first index (initial load/timed refresh)
  const queryLoop = useAbortable(maybeAbort => async (startIndex: number) => {
    debugLog(LOG_COINRANK, `queryLoop(start: ${startIndex})`)

    try {
      // Catch up to the total required items
      while (startIndex <= requestDataSize - QUERY_PAGE_SIZE + 1) {
        const url = `v2/coinrank?fiatCode=iso:${coingeckoFiat}&start=${startIndex}&length=${QUERY_PAGE_SIZE}`
        const response = await fetchRates(url).then(maybeAbort)
        if (!response.ok) {
          const text = await response.text().then(maybeAbort)
          console.warn(`API call failed with response: ${text}`)
          break
        }
        const replyJson = await response.json().then(maybeAbort)
        const listings = asCoinranking(replyJson)
        for (let i = 0; i < listings.data.length; i++) {
          const rankIndex = startIndex - 1 + i
          const row = listings.data[i]
          coinRankingDatas[rankIndex] = row
          debugLog(
            LOG_COINRANK,
            `queryLoop: ${rankIndex.toString()} ${row.rank} ${row.currencyCode}`
          )
        }
        startIndex += QUERY_PAGE_SIZE
      }
    } catch (e: any) {
      console.warn(
        `Error during data fetch: ${e.message}, ${coingeckoFiat}, ${startIndex}, ${requestDataSize}`
      )
    }

    setDataSize(coinRankingDatas.length)
    lastStartIndex.current = startIndex
  })

  // Query for a new page of data:
  const pageQueryAbortRef = React.useRef<() => void>(() => {})
  React.useEffect(() => {
    const { promise, abort } = queryLoop(lastStartIndex.current)
    pageQueryAbortRef.current = abort
    promise.catch(e => console.error(`Error in query loop: ${e.message}`))
    return abort
  }, [queryLoop, requestDataSize])

  // Subscribe to changes to coingeckoFiat and update the periodic refresh
  React.useEffect(() => {
    let abort = () => {}
    // Refresh from the beginning periodically
    let timeoutId = setTimeout(loopBody, LISTINGS_REFRESH_INTERVAL)
    function loopBody() {
      debugLog(LOG_COINRANK, 'Refreshing list')
      const abortable = queryLoop(1)
      abort = abortable.abort
      abortable.promise
        .catch(e => console.error(`Error in query loop: ${e.message}`))
        .finally(() => {
          timeoutId = setTimeout(loopBody, LISTINGS_REFRESH_INTERVAL)
        })
    }

    return () => {
      // Reset related query state when this effect is unmounted:
      clearTimeout(timeoutId)
      abort()
      pageQueryAbortRef.current()
      coinRanking.coinRankingDatas = []
      lastStartIndex.current = 1
      setDataSize(0)
      setRequestDataSize(QUERY_PAGE_SIZE)
    }
  }, [coingeckoFiat /* reset subscription on fiat change */, queryLoop])

  const listData: number[] = React.useMemo(() => {
    debugLog(
      LOG_COINRANK,
      `Updating listData dataSize=${dataSize} searchText=${searchText}`
    )
    const out = []
    for (let i = 0; i < dataSize; i++) {
      const cr = coinRankingDatas[i]
      if (searchText === '') {
        out.push(i)
      } else {
        if (
          cr.currencyCode.toLowerCase().includes(searchText.toLowerCase()) ||
          cr.currencyName.toLowerCase().includes(searchText.toLowerCase())
        ) {
          out.push(i)
        }
      }
    }
    return out

    // Do not re-render on change of coinRankings. This is intended to be
    // asynchronously accessed by each individual row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSize, searchText])

  const timeFrameString = percentChangeStrings[percentChangeTimeFrame]
  const assetSubTextString = assetSubTextStrings[assetSubText]

  const renderFooter: FooterRender = React.useCallback(
    sceneWrapperInfo => {
      return (
        <SearchFooter
          name="CoinRankingScene-SearchFooter"
          placeholder={lstrings.search_assets}
          isSearching={isSearching}
          searchText={searchText}
          sceneWrapperInfo={sceneWrapperInfo}
          onStartSearching={handleStartSearching}
          onDoneSearching={handleDoneSearching}
          onChangeText={handleChangeText}
          onLayoutHeight={handleFooterLayoutHeight}
        />
      )
    },
    [
      handleChangeText,
      handleDoneSearching,
      handleFooterLayoutHeight,
      handleStartSearching,
      isSearching,
      searchText
    ]
  )

  return (
    <SceneWrapper
      avoidKeyboard
      footerHeight={footerHeight}
      hasNotifications
      renderFooter={renderFooter}
    >
      {({ insetStyle, undoInsetStyle }) => (
        <>
          <View style={styles.headerContainer}>
            <View style={styles.rankView}>
              <EdgeText style={styles.rankText}>
                {lstrings.coin_rank_rank}
              </EdgeText>
            </View>
            <EdgeTouchableOpacity
              style={styles.assetView}
              onPress={handlePriceSubText}
            >
              <EdgeText style={styles.assetText}>{assetSubTextString}</EdgeText>
            </EdgeTouchableOpacity>
            <EdgeTouchableOpacity
              style={styles.percentChangeView}
              onPress={handlePercentChange}
            >
              <EdgeText style={styles.percentChangeText}>
                {timeFrameString}
              </EdgeText>
            </EdgeTouchableOpacity>
            <View style={styles.priceView}>
              <EdgeText style={styles.priceText}>
                {lstrings.coin_rank_price}
              </EdgeText>
            </View>
          </View>
          <DividerLine marginRem={[0, 0, 0, 1]} />
          <View style={{ ...undoInsetStyle, marginTop: 0 }}>
            {listData.length === 0 ? (
              <FillLoader />
            ) : (
              <Animated.FlatList
                contentContainerStyle={{ ...insetStyle, paddingTop: 0 }}
                data={listData}
                extraData={extraData}
                keyboardDismissMode="on-drag"
                onEndReachedThreshold={1}
                onEndReached={handleEndReached}
                onScroll={handleScroll}
                renderItem={renderItem}
                scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
              />
            )}
          </View>
        </>
      )}
    </SceneWrapper>
  )
}

export const CoinRankingScene = React.memo(CoinRankingComponent)

const getStyles = cacheStyles((theme: Theme) => {
  const baseTextStyle = {
    fontSize: theme.rem(0.75)
  }
  const baseTextView = {
    height: theme.rem(2)
  }

  return {
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: theme.rem(1),
      paddingRight: theme.rem(1)
    },
    searchDoneButton: {
      justifyContent: 'center',
      paddingLeft: theme.rem(0.75)
    },
    rankView: {
      ...baseTextView,
      justifyContent: 'center',
      width: theme.rem(5.25)
    },
    rankText: {
      ...baseTextStyle
    },
    assetView: {
      ...baseTextView,
      justifyContent: 'center',
      width: theme.rem(4.75)
    },
    assetText: {
      ...baseTextStyle,
      color: theme.textLink
    },
    percentChangeView: {
      ...baseTextView,
      justifyContent: 'center',
      width: theme.rem(4)
    },
    percentChangeText: {
      ...baseTextStyle,
      color: theme.textLink
    },
    priceView: {
      ...baseTextView,
      justifyContent: 'center',
      flex: 1
    },
    priceText: {
      ...baseTextStyle,
      textAlign: 'right'
    },
    tappableHeaderText: {
      color: theme.textLink
    }
  }
})
