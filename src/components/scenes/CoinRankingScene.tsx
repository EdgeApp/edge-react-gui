import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import s from '../../locales/strings'
import { asCoinranking, AssetSubText, CoinRanking, PercentChangeTimeFrame } from '../../types/coinrankTypes'
import { useState } from '../../types/reactHooks'
import { NavigationProp } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { debugLog, enableDebugLogType, LOG_COINRANK } from '../../util/logger'
import { fetchRates } from '../../util/network'
import { SceneWrapper } from '../common/SceneWrapper'
import { CoinRankRow } from '../data/row/CoinRankRow'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { OutlinedTextInput, OutlinedTextInputRef } from '../themed/OutlinedTextInput'

const coinRanking: CoinRanking = { coinRankingDatas: [] }

const QUERY_PAGE_SIZE = 30
const LISTINGS_REFRESH_INTERVAL = 30000

// Masking enable bit with 0 disables logging
enableDebugLogType(LOG_COINRANK & 0)

interface Props {
  navigation: NavigationProp<'coinRanking'>
  // route: RouteProp<'coinRanking'>
}

const percentChangeOrder: PercentChangeTimeFrame[] = ['hours1', 'hours24', 'days7', 'days30', 'year1']
const percentChangeStrings: { [pc: string]: string } = {
  hours1: '1hr',
  hours24: '24hr',
  days7: '7d',
  days30: '30d',
  year1: '1y'
}
const assetSubTextStrings: { [pc: string]: string } = {
  marketCap: s.strings.coin_rank_market_cap_abbreviation,
  volume24h: s.strings.coin_rank_volume_24hr_abbreviation
}

type Timeout = ReturnType<typeof setTimeout>
const CoinRankingComponent = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { navigation } = props
  const mounted = React.useRef<boolean>(true)
  const textInput = React.useRef<OutlinedTextInputRef>(null)
  const timeoutHandler = React.useRef<Timeout | undefined>()

  const [requestDataSize, setRequestDataSize] = useState<number>(QUERY_PAGE_SIZE)
  const [dataSize, setDataSize] = useState<number>(0)
  const [searchText, setSearchText] = useState<string>('')
  const [searching, setSearching] = useState<boolean>(false)
  const [percentChangeTimeFrame, setPercentChangeTimeFrame] = useState<PercentChangeTimeFrame>('hours24')
  const [assetSubText, setPriceSubText] = useState<AssetSubText>('marketCap')
  const [fiatCode] = useState<string>('iso:USD')

  const { coinRankingDatas } = coinRanking

  const renderItem = useHandler((itemObj: FlatListItem<number>) => {
    const { index, item } = itemObj
    const currencyCode = coinRankingDatas[index]?.currencyCode ?? 'NO_CURRENCY_CODE'
    const rank = coinRankingDatas[index]?.rank ?? 'NO_RANK'
    const key = `${index}-${item}-${rank}-${currencyCode}`
    debugLog(LOG_COINRANK, `renderItem ${key.toString()}`)

    return (
      <CoinRankRow
        navigation={navigation}
        index={item}
        key={key}
        coinRanking={coinRanking}
        percentChangeTimeFrame={percentChangeTimeFrame}
        assetSubText={assetSubText}
      />
    )
  })

  const handleEndReached = useHandler(() => {
    debugLog(LOG_COINRANK, `handleEndReached. setRequestDataSize ${requestDataSize + QUERY_PAGE_SIZE}`)
    setRequestDataSize(requestDataSize + QUERY_PAGE_SIZE)
  })

  const handlePercentChange = useHandler(() => {
    const index = percentChangeOrder.indexOf(percentChangeTimeFrame)
    if (index < 0) {
      const msg = `Invalid percent change value ${percentChangeTimeFrame}`
      console.error(msg)
      showError(msg)
      return
    }
    const newIndex = index + 1 >= percentChangeOrder.length ? 0 : index + 1
    const newTimeFrame = percentChangeOrder[newIndex]
    setPercentChangeTimeFrame(newTimeFrame)
  })

  const handlePriceSubText = useHandler(() => {
    const newPriceSubText = assetSubText === 'marketCap' ? 'volume24h' : 'marketCap'
    setPriceSubText(newPriceSubText)
  })

  const handleOnChangeText = useHandler((input: string) => {
    setSearchText(input)
  })
  const handleTextFieldFocus = useHandler(() => {
    setSearching(true)
  })
  const handleSearchDone = useHandler(() => {
    setSearchText('')
    setSearching(false)
    textInput.current?.blur()
  })
  const handleSubmit = useHandler(() => {
    if (searchText === '') {
      setSearching(false)
    }
  })

  React.useEffect(() => {
    return () => {
      if (timeoutHandler.current != null) {
        clearTimeout(timeoutHandler.current)
      }
      mounted.current = false
    }
  }, [])

  useAsyncEffect(async () => {
    const queryLoop = async () => {
      try {
        let start = 1
        debugLog(LOG_COINRANK, `queryLoop dataSize=${dataSize} requestDataSize=${requestDataSize}`)
        while (start < requestDataSize) {
          const url = `v2/coinrank?fiatCode=${fiatCode}&start=${start}&length=${QUERY_PAGE_SIZE}`
          const response = await fetchRates(url)
          if (!response.ok) {
            const text = await response.text()
            console.warn(text)
            break
          }
          const replyJson = await response.json()
          const listings = asCoinranking(replyJson)
          for (let i = 0; i < listings.data.length; i++) {
            const rankIndex = start - 1 + i
            const row = listings.data[i]
            coinRankingDatas[rankIndex] = row
            debugLog(LOG_COINRANK, `queryLoop: ${rankIndex.toString()} ${row.rank} ${row.currencyCode}`)
          }
          start += QUERY_PAGE_SIZE
        }
        setDataSize(coinRankingDatas.length)
      } catch (e: any) {
        console.warn(e.message)
      }
      timeoutHandler.current = setTimeout(queryLoop, LISTINGS_REFRESH_INTERVAL)
    }
    if (timeoutHandler.current != null) {
      clearTimeout(timeoutHandler.current)
    }
    queryLoop().catch(e => debugLog(LOG_COINRANK, e.message))
  }, [requestDataSize])

  const listdata: number[] = React.useMemo(() => {
    debugLog(LOG_COINRANK, `Updating listdata dataSize=${dataSize} searchText=${searchText}`)
    const out = []
    for (let i = 0; i < dataSize; i++) {
      const cr = coinRankingDatas[i]
      if (searchText === '') {
        out.push(i)
      } else {
        if (cr.currencyCode.toLowerCase().includes(searchText.toLowerCase()) || cr.currencyName.toLowerCase().includes(searchText.toLowerCase())) {
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

  return (
    <SceneWrapper background="theme" hasTabs>
      <View style={styles.searchContainer}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <OutlinedTextInput
            returnKeyType="search"
            label={s.strings.search_assets}
            onChangeText={handleOnChangeText}
            value={searchText ?? ''}
            onFocus={handleTextFieldFocus}
            onSubmitEditing={handleSubmit}
            ref={textInput}
            marginRem={0}
            searchIcon
          />
        </View>
        {searching && (
          <TouchableOpacity onPress={handleSearchDone} style={styles.searchDoneButton}>
            <EdgeText style={{ color: theme.textLink }}>{s.strings.string_done_cap}</EdgeText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.container}>
        <View style={styles.rankView}>
          <EdgeText style={styles.rankText}>{s.strings.coin_rank_rank}</EdgeText>
        </View>
        <TouchableOpacity style={styles.assetView} onPress={handlePriceSubText}>
          <EdgeText style={styles.assetText}>{assetSubTextString}</EdgeText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.percentChangeView} onPress={handlePercentChange}>
          <EdgeText style={styles.percentChangeText}>{timeFrameString}</EdgeText>
        </TouchableOpacity>
        <View style={styles.priceView}>
          <EdgeText style={styles.priceText}>{s.strings.coin_rank_price}</EdgeText>
        </View>
      </View>
      <DividerLine marginRem={[0, 0, 0, 1]} />
      <FlatList
        contentContainerStyle={styles.contentContainer}
        data={listdata}
        renderItem={renderItem}
        onEndReachedThreshold={1}
        onEndReached={handleEndReached}
      />
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
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: theme.rem(1),
      paddingRight: theme.rem(1)
    },
    contentContainer: { flexGrow: 1 },
    searchContainer: {
      flexDirection: 'row',
      marginVertical: theme.rem(0.5),
      marginHorizontal: theme.rem(1)
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
      width: theme.rem(5)
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
    }
  }
})
