import {
  asArray,
  asMaybe,
  asNumber,
  asObject,
  asString,
  asTuple
} from 'cleaners'
import * as React from 'react'
import { Dimensions, type LayoutChangeEvent, View } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import { getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { formatFiatString } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { formatDate } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getCoingeckoFiat } from '../../selectors/SettingsSelectors'
import { useSelector } from '../../types/reactRedux'
import { snooze } from '../../util/utils'
import { MinimalButton } from '../buttons/MinimalButton'
import { FillLoader } from '../progress-indicators/FillLoader'
import { type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

// Timespans supported
type Timespan = 'year' | 'month' | 'week' | 'day' | 'hour'

// CoinGecko API data types
type CoinGeckoDataPair = number[]
interface CoinGeckoMarketChartRange {
  prices: CoinGeckoDataPair[]
  market_caps: CoinGeckoDataPair[]
  total_volumes: CoinGeckoDataPair[]
}

// Component props
interface Props {
  /** The asset's 'id' as defined by CoinGecko */
  assetId: string
}

// Internal chart point used for fetching/cache
interface ChartDataPoint {
  x: Date
  y: number
}

// Cleaners
const asCoinGeckoDataPair = asTuple(asNumber, asNumber)
const asCoinGeckoError = asObject({
  status: asObject({
    error_code: asNumber,
    error_message: asString
  })
})
const asCoinGeckoMarketChartRange = asObject<CoinGeckoMarketChartRange>({
  prices: asArray(asCoinGeckoDataPair),
  market_caps: asArray(asCoinGeckoDataPair),
  total_volumes: asArray(asCoinGeckoDataPair)
})

// API constants
const COINGECKO_URL = 'https://api.coingecko.com'
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com'
const MARKET_CHART_ENDPOINT_4S =
  '/api/v3/coins/%1$s/market_chart/range?vs_currency=%2$s&from=%3$s&to=%4$s'

// Times in seconds
const UNIX_SECONDS_HOUR_OFFSET = 60 * 60
const UNIX_SECONDS_DAY_OFFSET = 24 * UNIX_SECONDS_HOUR_OFFSET
const UNIX_SECONDS_WEEK_OFFSET = 7 * UNIX_SECONDS_DAY_OFFSET
const UNIX_SECONDS_MONTH_OFFSET = 30 * UNIX_SECONDS_DAY_OFFSET
const UNIX_SECONDS_YEAR_OFFSET = 365 * UNIX_SECONDS_DAY_OFFSET

// Defaults
const BUTTON_MARGINS = [0, 0.5, 0, 0.5]
const CHART_HEIGHT_REM = 11
const DEFAULT_CHART_DATA: Array<[Timespan, ChartDataPoint[] | undefined]> = [
  ['hour', undefined],
  ['week', undefined],
  ['month', undefined],
  ['year', undefined]
]

// Format timestamp for labels/tooltips per timespan
const formatTimestamp = (
  date: Date,
  timespan: Timespan
): { xTooltip: string } => {
  const dateWithYear = formatDate(date, 'P')
  const time = formatDate(date, 'p')
  const dateTime = `${dateWithYear} ${time}`

  switch (timespan) {
    case 'year':
    case 'month':
      return { xTooltip: dateWithYear }
    case 'week':
    case 'day':
      return { xTooltip: dateTime }
    default:
      return { xTooltip: dateTime }
  }
}

// Reduce datapoints to improve performance
const reduceChartData = (
  chartData: ChartDataPoint[],
  timespan: Timespan
): ChartDataPoint[] => {
  let everyNPoints = 1
  switch (timespan) {
    case 'year':
      everyNPoints = 7
      break
    case 'month':
      everyNPoints = 12
      break
    case 'week':
      everyNPoints = 4
      break
    case 'day':
      everyNPoints = 6
      break
    default:
      everyNPoints = 1
  }
  return chartData.filter((_, index) => index % everyNPoints === 0)
}

const SwipeChartComponent = (params: Props): React.ReactElement => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { assetId } = params

  // Reset data on asset change
  React.useEffect(() => {
    setChartData([])
    setCachedChartData(
      new Map<Timespan, ChartDataPoint[] | undefined>(DEFAULT_CHART_DATA)
    )
    setIsFetching(false)
    setFetchAssetId(assetId)
  }, [assetId])

  // Chart state
  const [fetchAssetId, setFetchAssetId] = React.useState<string>(assetId)
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [cachedTimespanChartData, setCachedChartData] = React.useState<
    Map<Timespan, ChartDataPoint[] | undefined>
  >(new Map<Timespan, ChartDataPoint[] | undefined>(DEFAULT_CHART_DATA))
  const [selectedTimespan, setSelectedTimespan] =
    React.useState<Timespan>('month')
  const [queryFromTimeOffset, setQueryFromTimeOffset] = React.useState(
    UNIX_SECONDS_MONTH_OFFSET
  )
  const [isFetching, setIsFetching] = React.useState(false)

  const coingeckoFiat = useSelector(state => getCoingeckoFiat(state))
  const isConnected = useSelector(state => state.network.isConnected)
  const fiatSymbol = React.useMemo(
    () => getFiatSymbol(coingeckoFiat),
    [coingeckoFiat]
  )

  const isLoading = isFetching || !isConnected

  // Dimensions
  const [chartWidth, setChartWidth] = React.useState(
    Dimensions.get('window').width
  )
  const chartHeight = theme.rem(CHART_HEIGHT_REM)

  // Fetch/cache data
  useAsyncEffect(
    async () => {
      if (!isConnected) setIsFetching(false)
      if (isFetching || !isConnected) return

      setIsFetching(true)
      setChartData([])

      const cached = cachedTimespanChartData.get(selectedTimespan)
      if (cached != null) {
        setTimeout(() => {
          setChartData(cached)
          setIsFetching(false)
        }, 10)
        return
      }

      const unixNow = Math.trunc(new Date().getTime() / 1000)
      const fromParam = unixNow - queryFromTimeOffset
      const fetchPath = sprintf(
        MARKET_CHART_ENDPOINT_4S,
        fetchAssetId,
        coingeckoFiat,
        fromParam,
        unixNow
      )
      let fetchUrl = `${COINGECKO_URL}${fetchPath}`
      do {
        try {
          const response = await fetch(fetchUrl)
          const result = await response.json()
          const apiError = asMaybe(asCoinGeckoError)(result)
          if (apiError != null) {
            if (apiError.status.error_code === 429) {
              if (
                !fetchUrl.includes('x_cg_pro_api_key') &&
                ENV.COINGECKO_API_KEY !== ''
              ) {
                fetchUrl = `${COINGECKO_URL_PRO}${fetchPath}&x_cg_pro_api_key=${ENV.COINGECKO_API_KEY}`
              }
              await snooze(2000)
              continue
            }
            throw new Error(
              `Failed to fetch market data: ${apiError.status.error_code} ${apiError.status.error_message}`
            )
          }

          const marketChartRange = asCoinGeckoMarketChartRange(result)
          const rawChartData = marketChartRange.prices.map(pair => ({
            x: new Date(pair[0]),
            y: pair[1]
          }))
          const reduced = reduceChartData(rawChartData, selectedTimespan)

          setChartData(reduced)
          cachedTimespanChartData.set(selectedTimespan, reduced)
          setCachedChartData(cachedTimespanChartData)
        } finally {
          setIsFetching(false)
        }
        break
      } while (true)
    },
    [selectedTimespan, isConnected, fetchAssetId],
    'swipeChart'
  )

  // Handlers
  const handleLayout = useHandler((event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width)
  })

  const handleSetTimespanH = useHandler(() => {
    setSelectedTimespan('hour')
    setQueryFromTimeOffset(UNIX_SECONDS_HOUR_OFFSET)
  })
  const handleSetTimespanD = useHandler(() => {
    setSelectedTimespan('day')
    setQueryFromTimeOffset(UNIX_SECONDS_DAY_OFFSET)
  })
  const handleSetTimespanW = useHandler(() => {
    setSelectedTimespan('week')
    setQueryFromTimeOffset(UNIX_SECONDS_WEEK_OFFSET)
  })
  const handleSetTimespanM = useHandler(() => {
    setSelectedTimespan('month')
    setQueryFromTimeOffset(UNIX_SECONDS_MONTH_OFFSET)
  })
  const handleSetTimespanY = useHandler(() => {
    setSelectedTimespan('year')
    setQueryFromTimeOffset(UNIX_SECONDS_YEAR_OFFSET)
  })

  // Prepare data for gifted-charts
  const giftedData = React.useMemo(() => {
    return chartData.map(point => ({
      value: point.y,
      label: formatTimestamp(point.x, selectedTimespan).xTooltip
    }))
  }, [chartData, selectedTimespan])

  // Price formatting helper
  const formatPrice = React.useCallback(
    (value: number) =>
      `${fiatSymbol}${formatFiatString({
        fiatAmount: value.toString(),
        autoPrecision: true
      })}`,
    [fiatSymbol]
  )

  // Compute Y-axis offset so the chart baseline starts at the dataset's min
  const yAxisOffset = React.useMemo(() => {
    if (chartData.length === 0) return undefined as number | undefined
    const values = chartData.map(p => p.y)
    const min = Math.min(...values)
    const max = Math.max(...values)
    if (min === max) {
      const pad = min === 0 ? 1 : Math.abs(min) * 0.01
      return min - pad
    }
    return min
  }, [chartData])

  // Main render
  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Timespan controls */}
      <View style={styles.controlBar}>
        <MinimalButton
          key="hour"
          marginRem={BUTTON_MARGINS}
          label={lstrings.coin_rank_hour}
          highlighted={selectedTimespan === 'hour'}
          onPress={handleSetTimespanH}
          disabled={isLoading}
        />
        <MinimalButton
          key="day"
          marginRem={BUTTON_MARGINS}
          label={lstrings.coin_rank_day}
          highlighted={selectedTimespan === 'day'}
          onPress={handleSetTimespanD}
          disabled={isLoading}
        />
        <MinimalButton
          key="week"
          marginRem={BUTTON_MARGINS}
          label={lstrings.coin_rank_week}
          highlighted={selectedTimespan === 'week'}
          onPress={handleSetTimespanW}
          disabled={isLoading}
        />
        <MinimalButton
          key="month"
          marginRem={BUTTON_MARGINS}
          label={lstrings.coin_rank_month}
          highlighted={selectedTimespan === 'month'}
          onPress={handleSetTimespanM}
          disabled={isLoading}
        />
        <MinimalButton
          key="year"
          marginRem={BUTTON_MARGINS}
          label={lstrings.coin_rank_year}
          highlighted={selectedTimespan === 'year'}
          onPress={handleSetTimespanY}
          disabled={isLoading}
        />
      </View>

      {/* Chart / Loader */}
      {giftedData.length === 0 || isLoading ? (
        <View style={styles.loader}>
          <FillLoader />
        </View>
      ) : (
        <LineChart
          data={giftedData}
          width={chartWidth}
          height={chartHeight}
          color={theme.iconTappable}
          thickness={1.5}
          adjustToWidth
          initialSpacing={0}
          endSpacing={0}
          yAxisLabelWidth={0}
          scrollToEnd={false}
          hideDataPoints
          hideRules
          hideYAxisText
          areaChart
          startFillColor={theme.iconTappable}
          endFillColor={theme.iconTappable}
          startOpacity={0.5}
          endOpacity={0}
          yAxisOffset={yAxisOffset}
          pointerConfig={{
            showPointerStrip: true,
            pointerStripColor: theme.deactivatedText,
            pointerStripWidth: 1,
            pointerStripHeight: chartHeight,
            pointerColor: theme.iconTappable,
            radius: 4,
            activatePointersOnLongPress: true,
            activatePointersDelay: 150,
            pointerLabelComponent: (
              items: Array<{ value: number; label?: string }>
            ): React.ReactElement => {
              const item = items[0]
              const label = item?.label ?? ''
              return (
                <View style={styles.pointerLabel}>
                  <EdgeText style={styles.labelPrimary}>
                    {formatPrice(item.value)}
                  </EdgeText>
                  {label !== '' ? (
                    <EdgeText style={styles.label}>{label}</EdgeText>
                  ) : null}
                </View>
              )
            }
          }}
        />
      )}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    container: {
      margin: theme.rem(0.5),
      overflow: 'hidden'
    },
    controlBar: {
      justifyContent: 'center',
      flexDirection: 'row',
      marginBottom: theme.rem(0.25)
    },
    loader: {
      marginTop: theme.rem(0),
      height: theme.rem(CHART_HEIGHT_REM)
    },
    label: {
      color: theme.primaryText,
      fontSize: theme.rem(0.75)
    },
    labelPrimary: {
      color: theme.primaryText,
      fontSize: theme.rem(0.75),
      fontFamily: theme.fontFaceBold
    },
    pointerLabel: {
      minWidth: theme.rem(5),
      paddingHorizontal: theme.rem(0.5),
      paddingVertical: theme.rem(0.25),
      backgroundColor: theme.tileBackground,
      borderRadius: theme.rem(0.25)
    }
  }
})

export const SwipeChart = React.memo(SwipeChartComponent)
