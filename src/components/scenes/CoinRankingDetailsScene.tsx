import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { formatFiatString } from '../../hooks/useFiatText'
import { toLocaleDate, toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { CoinRankingData, CoinRankingDataPercentChange } from '../../types/coinrankTypes'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { formatLargeNumberString as formatLargeNumber } from '../../util/utils'
import { SwipeChart } from '../charts/SwipeChart'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

type CoinRankingDataValueType = string | number | CoinRankingDataPercentChange | undefined

export interface CoinRankingDetailsParams {
  coinRankingData: CoinRankingData
}

interface Props extends EdgeSceneProps<'coinRankingDetails'> {}

const COINRANKINGDATA_TITLE_MAP: { [key: string]: string } = {
  currencyCode: '',
  currencyName: '',
  imageUrl: '',
  marketCap: lstrings.coin_rank_title_market_cap,
  percentChange: '', // Display the children of this field instead

  // Keys of percentChange
  hours1: lstrings.coin_rank_title_hours_1,
  hours24: lstrings.coin_rank_title_hours_24,
  days7: lstrings.coin_rank_title_days_7,
  days30: lstrings.coin_rank_title_days_30,
  year1: lstrings.coin_rank_title_year_1,

  price: lstrings.coin_rank_price,
  rank: lstrings.coin_rank_rank,
  volume24h: lstrings.coin_rank_title_volume_24h,
  high24h: lstrings.coin_rank_title_high_24h,
  low24h: lstrings.coin_rank_title_low_24h,
  priceChange24h: lstrings.coin_rank_title_price_change_24h,
  priceChangePercent24h: '', // Duplicate of percentChange children
  marketCapChange24h: lstrings.coin_rank_title_market_cap_change_24h,
  marketCapChangePercent24h: '', // Appended to marketCapChange24h
  circulatingSupply: lstrings.coin_rank_title_circulating_supply,
  totalSupply: lstrings.coin_rank_title_total_supply,
  maxSupply: lstrings.coin_rank_title_max_supply,
  allTimeHigh: lstrings.coin_rank_title_all_time_high,
  allTimeHighDate: '', // Appended to allTimeHigh
  allTimeLow: lstrings.coin_rank_title_all_time_low,
  allTimeLowDate: '' // Appended to allTimeLow
}

const PERCENT_CHANGE_DATA_KEYS: string[] = ['hours1', 'hours24', 'days7', 'days30', 'year1']

const COLUMN_LEFT_DATA_KEYS: Array<keyof CoinRankingData> = ['price', 'priceChange24h', 'percentChange', 'high24h', 'low24h']

const COLUMN_RIGHT_DATA_KEYS: Array<keyof CoinRankingData> = [
  'rank',
  'volume24h',
  'marketCap',
  'marketCapChange24h',
  'totalSupply',
  'circulatingSupply',
  'maxSupply',
  'allTimeHigh',
  'allTimeLow'
]

const CoinRankingDetailsSceneComponent = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { navigation, route } = props
  const { coinRankingData } = route.params
  const { currencyCode, currencyName } = coinRankingData
  const currencyCodeUppercase = currencyCode.toUpperCase()

  const defaultFiat = useSelector(state => getDefaultFiat(state))

  const imageUrlObject = React.useMemo(
    () => ({
      uri: coinRankingData.imageUrl ?? ''
    }),
    [coinRankingData]
  )

  const formatData = (data: CoinRankingDataValueType): string => {
    if (typeof data === 'number') {
      return formatLargeNumber(data)
    } else if (typeof data === 'string') {
      return data
    } else {
      return 'N/A'
    }
  }

  const parseCoinRankingData = (dataKey: string, data: CoinRankingDataValueType): string => {
    const baseString = formatData(data)
    let extendedString

    switch (dataKey) {
      case 'hours1':
      case 'hours24':
      case 'days7':
      case 'days30':
      case 'year1':
        return data == null ? 'N/A' : toPercentString(Number(data) / 100)
      case 'price':
      case 'priceChange24h':
      case 'high24h':
      case 'low24h':
        return `${formatFiatString({ fiatAmount: baseString })} ${defaultFiat}`
      case 'rank':
        return `#${baseString}`
      case 'marketCapChange24h':
        extendedString = coinRankingData.marketCapChangePercent24h != null ? ` (${toPercentString(coinRankingData.marketCapChangePercent24h / 100)})` : ''
        break
      case 'allTimeHigh':
        extendedString = coinRankingData.allTimeHighDate != null ? `- ${toLocaleDate(new Date(coinRankingData.allTimeHighDate))}` : ''
        break
      case 'allTimeLow':
        extendedString = coinRankingData.allTimeLowDate != null ? `- ${toLocaleDate(new Date(coinRankingData.allTimeLowDate))}` : ''
        break
      default:
        // If no special modifications, just return simple data formatting
        return baseString
    }

    return `${baseString} ${extendedString}`
  }

  const renderRow = (dataKey: string, data: CoinRankingDataValueType): JSX.Element => {
    return (
      <View style={styles.row} key={dataKey}>
        <EdgeText style={styles.rowTitle}>{COINRANKINGDATA_TITLE_MAP[dataKey]}</EdgeText>
        <EdgeText style={styles.rowBody}>{parseCoinRankingData(dataKey, data)}</EdgeText>
      </View>
    )
  }

  const renderRows = (coinRankingData: CoinRankingData | CoinRankingDataPercentChange, keysFilter: string[]): JSX.Element[] => {
    const rows: JSX.Element[] = []

    keysFilter.forEach((key: string) => {
      if (Object.keys(coinRankingData).some(coinRankingDataKey => coinRankingDataKey === key)) {
        if (key === 'percentChange') {
          rows.push(...renderRows((coinRankingData as CoinRankingData).percentChange, PERCENT_CHANGE_DATA_KEYS))
        } else {
          rows.push(renderRow(key, coinRankingData[key as keyof (CoinRankingData | CoinRankingDataPercentChange)]))
        }
      }
    })

    return rows
  }

  return (
    <NotificationSceneWrapper navigation={navigation} background="theme" scroll>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <FastImage style={styles.icon} source={imageUrlObject} />
          <EdgeText style={styles.title}>{`${currencyName} (${currencyCodeUppercase})`}</EdgeText>
        </View>
        <SwipeChart assetId={coinRankingData.assetId} currencyCode={currencyCodeUppercase} />
        <View style={styles.columns}>
          <View style={styles.column}>{renderRows(coinRankingData, COLUMN_LEFT_DATA_KEYS)}</View>
          <View style={styles.column}>{renderRows(coinRankingData, COLUMN_RIGHT_DATA_KEYS)}</View>
        </View>
      </View>
    </NotificationSceneWrapper>
  )
}

export const CoinRankingDetailsScene = React.memo(CoinRankingDetailsSceneComponent)

const getStyles = cacheStyles((theme: Theme) => {
  return {
    container: {
      padding: theme.rem(0.5)
    },
    column: {
      alignItems: 'flex-start',
      width: '50%'
    },
    columns: {
      flex: 1,
      flexDirection: 'row'
    },
    icon: {
      width: theme.rem(1.5),
      height: theme.rem(1.5)
    },
    row: {
      margin: theme.rem(0.5),
      justifyContent: 'center'
    },
    rowBody: {
      fontSize: theme.rem(0.75)
    },
    rowTitle: {
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(0.75)
    },
    title: {
      fontFamily: theme.fontFaceBold,
      marginLeft: theme.rem(0.5)
    },
    titleContainer: {
      margin: theme.rem(0.5),
      flexDirection: 'row',
      alignItems: 'center'
    }
  }
})
