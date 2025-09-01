import { useNavigation } from '@react-navigation/native'
import {
  asArray,
  asMaybe,
  asNumber,
  asObject,
  asString,
  asTuple
} from 'cleaners'
import * as React from 'react'
import {
  Dimensions,
  type LayoutChangeEvent,
  Platform,
  View
} from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'
import { sprintf } from 'sprintf-js'

import { getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { formatFiatString } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { formatDate } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getCoingeckoFiat } from '../../selectors/SettingsSelectors'
import { useSceneScrollContext } from '../../state/SceneScrollState'
import { useSelector } from '../../types/reactRedux'
import { snooze } from '../../util/utils'
import { MinimalButton } from '../buttons/MinimalButton'
import { FillLoader } from '../progress-indicators/FillLoader'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
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
const CHART_TOP_PADDING_REM = 1
const CHART_BOTTOM_PADDING_REM = 1
const DEFAULT_CHART_DATA: Array<[Timespan, ChartDataPoint[] | undefined]> = [
  ['hour', undefined],
  ['week', undefined],
  ['month', undefined],
  ['year', undefined]
]

// Animation timings (ms)
const ANIMATION_DURATION = {
  cursorFadeIn: 300,
  cursorFadeOut: 500,
  maxMinFadeIn: 300,
  maxMinFadeInDelay: 2000
}

// Format timestamp for labels/tooltips per timespan
const formatTimestamp = (
  date: Date,
  timespan: Timespan
): { xTooltip: string; xRange: string } => {
  const dateWithYear = formatDate(date, 'P')
  const time = formatDate(date, 'p')
  const dateTime = `${dateWithYear} ${time}`

  switch (timespan) {
    case 'year':
    case 'month':
      return { xTooltip: dateWithYear, xRange: dateWithYear }
    case 'week':
    case 'day':
      return { xTooltip: dateTime, xRange: dateWithYear }
    default:
      // 'hour'
      return { xTooltip: dateTime, xRange: time }
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

export const SwipeChart: React.FC<Props> = props => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { assetId } = props
  const navigation = useNavigation<any>()

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

  // Reset data when fiat changes to force refetch/new cache keyed by fiat
  React.useEffect(() => {
    setChartData([])
    setCachedChartData(
      new Map<Timespan, ChartDataPoint[] | undefined>(DEFAULT_CHART_DATA)
    )
    setIsFetching(false)
  }, [coingeckoFiat])

  // Dimensions
  const [chartWidth, setChartWidth] = React.useState(
    Dimensions.get('window').width
  )
  const chartHeight = theme.rem(CHART_HEIGHT_REM)
  const chartDrawHeight =
    chartHeight - theme.rem(CHART_TOP_PADDING_REM + CHART_BOTTOM_PADDING_REM)

  // Pointer tracking for bottom date label
  const [pointerIndex, setPointerIndex] = React.useState<number>(-1)
  const [pointerX, setPointerX] = React.useState<number>(0)
  const [cursorPosX, setCursorPosX] = React.useState<number>(0)
  const [cursorPosY, setCursorPosY] = React.useState<number>(0)
  const [cursorPriceText, setCursorPriceText] = React.useState<string>('')
  const [isCursorActive, setIsCursorActive] = React.useState(false)

  const [bottomLabelWidth, setBottomLabelWidth] = React.useState(theme.rem(5))
  const [pointerLabelWidth, setPointerLabelWidth] = React.useState(theme.rem(0))
  const [pointerLabelHeight, setPointerLabelHeight] = React.useState(
    theme.rem(1.5)
  )

  // On Android, temporarily disable drawer swipe while interacting with the
  // chart. These two gestures fight with each other on Android only...
  React.useEffect(() => {
    if (Platform.OS !== 'android') return
    const parent = navigation?.getParent?.()
    if (parent == null) return
    parent.setOptions({ swipeEnabled: !isCursorActive })
    return () => {
      parent.setOptions({ swipeEnabled: true })
    }
  }, [navigation, isCursorActive])

  // While pointer active, also disable SceneWrapper scrolling so gestures don't
  // conflict.
  const disableScroll = useSceneScrollContext(state => state.disableScroll)
  React.useEffect(() => {
    disableScroll.value = isCursorActive
    return () => {
      disableScroll.value = false
    }
  }, [disableScroll, isCursorActive])

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
      // Start with the free base URL
      let fetchUrl = `${COINGECKO_URL}${fetchPath}`
      do {
        try {
          // Construct the dataset query
          const response = await fetch(fetchUrl)
          const result = await response.json()
          const apiError = asMaybe(asCoinGeckoError)(result)
          if (apiError != null) {
            if (apiError.status.error_code === 429) {
              // Rate limit error, use our API key as a fallback
              if (
                !fetchUrl.includes('x_cg_pro_api_key') &&
                ENV.COINGECKO_API_KEY !== ''
              ) {
                fetchUrl = `${COINGECKO_URL_PRO}${fetchPath}&x_cg_pro_api_key=${ENV.COINGECKO_API_KEY}`
              }
              // Wait 2 second before retrying. It typically takes 1 minute
              // before rate limiting is relieved, so even 2 seconds is hasty.
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
    [selectedTimespan, isConnected, fetchAssetId, coingeckoFiat],
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

  const bottomLabelText = React.useMemo(() => {
    if (pointerIndex < 0 || pointerIndex >= chartData.length) return ''
    const dp = chartData[pointerIndex]
    return formatTimestamp(dp.x, selectedTimespan).xTooltip
  }, [chartData, pointerIndex, selectedTimespan])

  // Use a prototype string (longest current label) to stabilize measured width
  const prototypeBottomLabelText = React.useMemo(() => {
    if (giftedData.length === 0) return ''
    let longest = giftedData[0].label
    for (let i = 1; i < giftedData.length; i++) {
      const label = giftedData[i].label
      if (label.length > longest.length) longest = label
    }
    return longest
  }, [giftedData])

  // Price formatting helper
  const formatPrice = React.useCallback(
    (value: number) =>
      `${fiatSymbol}${formatFiatString({
        fiatAmount: value.toString(),
        autoPrecision: true
      })}`,
    [fiatSymbol]
  )

  // Price label text for pointer label measurer
  const pointerLabelText = React.useMemo(() => {
    if (pointerIndex === -1) return ''
    const item = giftedData[pointerIndex]
    if (item == null) return ''
    return formatPrice(item.value)
  }, [pointerIndex, giftedData, formatPrice])

  React.useEffect(() => {
    if (pointerIndex !== -1) setCursorPriceText(pointerLabelText)
  }, [pointerIndex, pointerLabelText])

  // Pointer callbacks
  const handleGetPointerProps = useHandler(
    (opts: { pointerIndex: number; pointerX: number; pointerY: number }) => {
      if (opts.pointerX > 0) {
        setPointerIndex(opts.pointerIndex)
        setPointerX(opts.pointerX)
        setCursorPosX(opts.pointerX)
        setCursorPosY(opts.pointerY)
      } else if (opts.pointerIndex === -1) {
        setPointerIndex(-1)
        setPointerX(0)
      }
    }
  )

  // Reset pointer visibility when touch ends/leaves
  const handlePointerEnd = useHandler(() => {
    setPointerIndex(-1)
    setPointerX(0)
    setIsCursorActive(false)
  })
  const handlePointerLeave = useHandler(() => {
    setPointerIndex(-1)
    setPointerX(0)
    setIsCursorActive(false)
  })
  const handlePointerStart = useHandler(() => {
    setIsCursorActive(true)
  })

  const handleBottomLabelLayout = useHandler((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout
    const bufferedWidth = width + theme.rem(0.25)
    if (Math.abs(bufferedWidth - bottomLabelWidth) > 1)
      setBottomLabelWidth(bufferedWidth)
  })

  // Offscreen measurer for pointer label text width/height
  const handleMeasurePointerLabelLayout = useHandler((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    // Add a small buffer to account for rounding/edges so label doesn't clip
    const bufferedWidth = width + theme.rem(0.25)
    setPointerLabelWidth(bufferedWidth)
    setPointerLabelHeight(height + theme.rem(0.5))
  })

  // Animations: cursor visibility and delayed min/max fade-in
  const sCursorOpacity = useSharedValue(0)
  const sMinMaxOpacity = useSharedValue(0)

  React.useEffect(() => {
    sCursorOpacity.value = withTiming(isCursorActive ? 1 : 0, {
      duration: isCursorActive
        ? ANIMATION_DURATION.cursorFadeIn
        : ANIMATION_DURATION.cursorFadeOut
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCursorActive])

  React.useEffect(() => {
    if (chartData.length > 0) {
      sMinMaxOpacity.value = 0
      sMinMaxOpacity.value = withTiming(1, {
        duration: ANIMATION_DURATION.maxMinFadeIn
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData])

  const aMinMaxOpacityStyle = useAnimatedStyle(() => ({
    opacity: sMinMaxOpacity.value * (1 - sCursorOpacity.value)
  }))

  const aXEndLabelStyle = useAnimatedStyle(() => ({
    opacity: 1 - sCursorOpacity.value
  }))

  const aCursorFadeStyle = useAnimatedStyle(() => ({
    opacity: sCursorOpacity.value
  }))

  // Compute Y-axis range with 15% "padding" above and below visible values to
  // make space for min/max label drawing.
  const { yAxisMinWithPad, yAxisMaxWithPad } = React.useMemo(() => {
    if (chartData.length === 0) {
      return {
        yAxisMinWithPad: undefined as number | undefined,
        yAxisMaxWithPad: undefined as number | undefined
      }
    }
    const values = chartData.map(point => point.y)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue
    const pad = range * 0.15
    return {
      yAxisMinWithPad: minValue - pad,
      yAxisMaxWithPad: maxValue + pad
    }
  }, [chartData])

  // Min/Max price points and indices
  const { minIndex, maxIndex, minPoint, maxPoint, minValue, maxValue } =
    React.useMemo(() => {
      if (chartData.length === 0)
        return {
          minIndex: -1,
          maxIndex: -1,
          minPoint: undefined as ChartDataPoint | undefined,
          maxPoint: undefined as ChartDataPoint | undefined,
          minValue: undefined as number | undefined,
          maxValue: undefined as number | undefined
        }

      let localMin = Number.POSITIVE_INFINITY
      let localMax = Number.NEGATIVE_INFINITY
      let localMinIndex = 0
      let localMaxIndex = 0
      for (let i = 0; i < chartData.length; i++) {
        const y = chartData[i].y
        if (y < localMin) {
          localMin = y
          localMinIndex = i
        }
        if (y > localMax) {
          localMax = y
          localMaxIndex = i
        }
      }
      return {
        minIndex: localMinIndex,
        maxIndex: localMaxIndex,
        minPoint: chartData[localMinIndex],
        maxPoint: chartData[localMaxIndex],
        minValue: localMin,
        maxValue: localMax
      }
    }, [chartData])

  // Prototype price text to pre-measure pointer label width/height
  const prototypePointerPriceText = React.useMemo(() => {
    const sample = maxValue ?? minValue
    if (sample == null) return ''
    return formatPrice(sample)
  }, [maxValue, minValue, formatPrice])

  // Measure min/max label sizes for justification & centering
  const [minLabelWidth, setMinLabelWidth] = React.useState(0)
  const [maxLabelWidth, setMaxLabelWidth] = React.useState(0)

  const handleMeasureMinLabelLayout = useHandler((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout
    if (Math.abs(width - minLabelWidth) > 1) setMinLabelWidth(width)
  })
  const handleMeasureMaxLabelLayout = useHandler((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout
    if (Math.abs(width - maxLabelWidth) > 1) setMaxLabelWidth(width)
  })

  // Helpers to translate data index/value -> pixel coordinates in our chart area
  const getXForIndex = React.useCallback(
    (index: number): number => {
      if (giftedData.length <= 1) return 0
      const spacing = chartWidth / (giftedData.length - 1)
      return spacing * index
    },
    [chartWidth, giftedData.length]
  )

  const getYForValue = React.useCallback(
    (value: number): number => {
      if (yAxisMaxWithPad == null || yAxisMinWithPad == null) return 0
      const range = yAxisMaxWithPad - yAxisMinWithPad
      if (range === 0) return chartDrawHeight / 2
      const normalized = (value - yAxisMinWithPad) / range
      return chartDrawHeight - normalized * chartDrawHeight
    },
    [chartDrawHeight, yAxisMaxWithPad, yAxisMinWithPad]
  )

  // Pulsing pointer (custom pointerComponent for gifted-charts)
  const basePointerRadius = theme.rem(0.5)

  const PulsingPointer: React.FC = () => {
    const animationProgress = useSharedValue(0)

    React.useEffect(() => {
      animationProgress.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      )
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const aInnerStyle = useAnimatedStyle(() => {
      const p = animationProgress.value
      // Inner: 0 -> 0.5 radius, opacity 1 -> 0.5
      const scale = 0.5 * p
      const opacity = 1 - 0.5 * p
      return { transform: [{ scale }], opacity }
    })

    const aOuterStyle = useAnimatedStyle(() => {
      const p = animationProgress.value
      // Outer: 0.5 -> 1.0 radius, opacity 0.5 -> 0
      const scale = 0.5 + 0.5 * p
      const opacity = 0.5 * (1 - p)
      return { transform: [{ scale }], opacity }
    })

    const containerSize = basePointerRadius * 2

    return (
      <View
        style={{
          width: containerSize,
          height: containerSize,
          alignItems: 'center',
          justifyContent: 'center'
        }}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: containerSize,
              height: containerSize,
              borderRadius: basePointerRadius,
              backgroundColor: theme.iconTappable
            },
            aInnerStyle
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: containerSize,
              height: containerSize,
              borderRadius: basePointerRadius,
              backgroundColor: theme.iconTappable
            },
            aOuterStyle
          ]}
        />
      </View>
    )
  }

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
        <View
          style={{
            height: chartHeight,
            position: 'relative',
            overflow: 'visible'
          }}
        >
          <View
            style={{
              height: chartDrawHeight,
              position: 'relative',
              overflow: 'visible'
            }}
          >
            <LineChart
              data={giftedData}
              width={chartWidth}
              height={chartDrawHeight}
              color={theme.emphasizedText}
              curved
              thickness={1.5}
              adjustToWidth
              initialSpacing={0}
              endSpacing={0}
              disableScroll
              yAxisLabelWidth={0}
              scrollToEnd={false}
              hideDataPoints
              hideRules
              hideYAxisText
              xAxisThickness={0}
              yAxisThickness={0}
              xAxisLabelsHeight={0}
              areaChart
              startFillColor={theme.emphasizedText}
              endFillColor={theme.emphasizedText}
              startOpacity={0.5}
              endOpacity={0}
              yAxisOffset={yAxisMinWithPad}
              maxValue={
                yAxisMaxWithPad != null && yAxisMinWithPad != null
                  ? yAxisMaxWithPad - yAxisMinWithPad
                  : undefined
              }
              pointerConfig={{
                showPointerStrip: true,
                pointerStripColor: theme.iconTappable,
                pointerStripWidth: 1,
                pointerStripHeight: chartDrawHeight,
                pointerColor: theme.iconTappable,
                radius: 0,
                shiftPointerLabelX: theme.rem(2),
                pointerStripUptoDataPoint: true,
                autoAdjustPointerLabelPosition: true,
                pointerLabelWidth: 0,
                pointerLabelHeight: 0,
                pointerComponent: () => <></>,
                pointerLabelComponent: (): React.ReactElement => {
                  return <></>
                },
                persistPointer: false,
                onPointerEnter: handlePointerStart,
                onResponderEnd: handlePointerEnd,
                onTouchEnd: handlePointerEnd,
                onPointerLeave: handlePointerLeave,
                onResponderGrant: handlePointerStart,
                onTouchStart: handlePointerStart
                // persistPointer: true
              }}
              getPointerProps={handleGetPointerProps}
            />
            {/* Overlay pulsing dot (persistent to avoid remount on move) */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  // Align with gifted-charts internal +1 left offset
                  left: cursorPosX + 1.25 - basePointerRadius,
                  top: cursorPosY - basePointerRadius - 2
                },
                aCursorFadeStyle
              ]}
              pointerEvents="none"
            >
              <PulsingPointer />
            </Animated.View>
            {/* Min/Max price labels overlay */}
            {giftedData.length > 0 && minIndex !== -1 && maxIndex !== -1 ? (
              <>
                {/* Min label (centered horizontally below the point) */}
                {minPoint != null && minValue != null ? (
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        left: Math.max(
                          0,
                          Math.min(
                            getXForIndex(minIndex) - minLabelWidth / 2,
                            chartWidth - minLabelWidth
                          )
                        ),
                        top: Math.max(
                          0,
                          Math.min(
                            getYForValue(minValue) + theme.rem(1.25),
                            chartDrawHeight - theme.rem(0.5)
                          )
                        )
                      },
                      aMinMaxOpacityStyle
                    ]}
                    pointerEvents="none"
                  >
                    <View onLayout={handleMeasureMinLabelLayout}>
                      <EdgeText
                        style={styles.labelPrice}
                        disableFontScaling
                        numberOfLines={1}
                      >
                        {formatPrice(minValue)}
                      </EdgeText>
                    </View>
                  </Animated.View>
                ) : null}

                {/* Max label (centered horizontally above the point) */}
                {maxPoint != null && maxValue != null ? (
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        left: Math.max(
                          0,
                          Math.min(
                            getXForIndex(maxIndex) - maxLabelWidth / 2,
                            chartWidth - maxLabelWidth
                          )
                        ),
                        top: Math.max(
                          0,
                          Math.min(
                            getYForValue(maxValue) - theme.rem(2.25),
                            chartDrawHeight - theme.rem(0.5)
                          )
                        )
                      },
                      aMinMaxOpacityStyle
                    ]}
                    pointerEvents="none"
                  >
                    <View onLayout={handleMeasureMaxLabelLayout}>
                      <EdgeText
                        style={styles.labelPrice}
                        disableFontScaling
                        numberOfLines={1}
                      >
                        {formatPrice(maxValue)}
                      </EdgeText>
                    </View>
                  </Animated.View>
                ) : null}
              </>
            ) : null}
            {/* Custom fading price label (uses latched coordinates) */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: Math.max(
                    0,
                    Math.min(
                      cursorPosX + 1.25 - pointerLabelWidth / 2,
                      chartWidth - pointerLabelWidth
                    )
                  ),
                  top: Math.max(
                    0,
                    Math.min(
                      cursorPosY - pointerLabelHeight - theme.rem(0.25),
                      chartDrawHeight - pointerLabelHeight
                    )
                  )
                },
                aCursorFadeStyle
              ]}
              pointerEvents="none"
            >
              <View style={styles.pointerLabelContainer}>
                <EdgeText
                  style={styles.labelPrimary}
                  disableFontScaling
                  numberOfLines={1}
                >
                  {cursorPriceText}
                </EdgeText>
              </View>
            </Animated.View>
          </View>
          {/* Bottom moving date label, centered below pointer line */}
          {isCursorActive && giftedData.length > 0 ? (
            <View
              style={{
                position: 'absolute',
                overflow: 'visible',
                bottom: theme.rem(0.5),
                left: Math.max(
                  0,
                  Math.min(
                    pointerX - bottomLabelWidth / 2,
                    chartWidth - bottomLabelWidth
                  )
                ),
                width: bottomLabelWidth,
                alignItems: 'center'
              }}
              pointerEvents="none"
            >
              {/* Allow font scaling since we measure an approximate width below */}
              <EdgeText style={styles.label}>{bottomLabelText}</EdgeText>
            </View>
          ) : null}
          {/* Hidden measurer for bottom date label width. This isn't perfect, 
              but it's close enough. We can't mess with dynamic widths too much 
              because it will cause flicker. */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              opacity: 0,
              padding: theme.rem(0.25)
            }}
            pointerEvents="none"
          >
            <EdgeText
              style={styles.label}
              disableFontScaling
              numberOfLines={1}
              onLayout={handleBottomLabelLayout}
            >
              {prototypeBottomLabelText}
            </EdgeText>
          </View>

          {/* Offscreen measurer for pointer price label width/height (always rendered) */}
          <View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                opacity: 0
              },
              styles.pointerLabelContainer
            ]}
            pointerEvents="none"
          >
            <EdgeText
              style={styles.labelPrimary}
              disableFontScaling
              numberOfLines={1}
              onLayout={handleMeasurePointerLabelLayout}
            >
              {pointerLabelText !== ''
                ? pointerLabelText
                : prototypePointerPriceText}
            </EdgeText>
          </View>
          {/* Static X-Axis Time Range End Labels */}
          {!isLoading && chartData.length > 0 ? (
            <Animated.View
              style={[styles.xEndLabels, aXEndLabelStyle]}
              pointerEvents="none"
            >
              <EdgeText style={styles.labelSecondary}>
                {
                  formatTimestamp(new Date(chartData[0].x), selectedTimespan)
                    .xRange
                }
              </EdgeText>
              <EdgeText style={styles.labelSecondary}>
                {
                  formatTimestamp(
                    new Date(chartData[chartData.length - 1].x),
                    selectedTimespan
                  ).xRange
                }
              </EdgeText>
            </Animated.View>
          ) : null}
        </View>
      )}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    container: {
      margin: theme.rem(0.5),
      overflow: 'visible'
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
    labelSecondary: {
      fontSize: theme.rem(0.75),
      color: theme.deactivatedText
    },
    labelPrice: {
      fontSize: theme.rem(0.75),
      color: theme.iconTappable
    },
    pointerLabelContainer: {
      overflow: 'visible',
      alignItems: 'center',
      justifyContent: 'center'
    },
    xEndLabels: {
      position: 'absolute',
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      bottom: theme.rem(0.5),
      paddingLeft: theme.rem(0.25),
      paddingRight: theme.rem(0.25)
    }
  }
})
