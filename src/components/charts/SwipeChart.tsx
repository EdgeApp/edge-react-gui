import { CursorProps, GradientProps, SlideAreaChart, ToolTipProps, ToolTipTextRenderersInput, YAxisProps } from '@connectedcars/react-native-slide-charts'
import { asArray, asEither, asNumber, asObject, asString, asTuple } from 'cleaners'
import * as React from 'react'
import { LayoutChangeEvent, Platform, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import Animated, { Easing, SharedValue, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated'
import Svg, { Circle, CircleProps, LinearGradient, Stop } from 'react-native-svg'
import { sprintf } from 'sprintf-js'

import { getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { formatFiatString } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { formatDate } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { MinimalButton } from '../buttons/MinimalButton'
import { FillLoader } from '../progress-indicators/FillLoader'
import { showWarning } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'
import { ReText } from '../text/ReText'
import { EdgeText } from '../themed/EdgeText'

type Timespan = 'year' | 'month' | 'week' | 'day' | 'hour'
type CoinGeckoDataPair = number[]

interface Props {
  assetId: string // The asset's 'id' as defined by CoinGecko
  currencyCode: string
  fiatCurrencyCode: string
}
interface ChartDataPoint {
  x: Date
  y: number
}
interface CoinGeckoMarketChartRange {
  prices: CoinGeckoDataPair[]
  market_caps: CoinGeckoDataPair[]
  total_volumes: CoinGeckoDataPair[]
}

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

const asCoinGeckoMarketApi = asEither(asCoinGeckoMarketChartRange, asCoinGeckoError)

const COINGECKO_URL = 'https://api.coingecko.com'
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com'
const MARKET_CHART_ENDPOINT_4S = '/api/v3/coins/%1$s/market_chart/range?vs_currency=%2$s&from=%3$s&to=%4$s'

const UNIX_SECONDS_HOUR_OFFSET = 60 * 60
const UNIX_SECONDS_DAY_OFFSET = 24 * UNIX_SECONDS_HOUR_OFFSET
const UNIX_SECONDS_WEEK_OFFSET = 7 * UNIX_SECONDS_DAY_OFFSET
const UNIX_SECONDS_MONTH_OFFSET = 30 * UNIX_SECONDS_DAY_OFFSET
const UNIX_SECONDS_YEAR_OFFSET = 365 * UNIX_SECONDS_DAY_OFFSET

const ANIMATION_DURATION = {
  cursorFadeIn: 300,
  cursorFadeOut: 500,
  cursorPulse: 1000,
  maxMinFadeIn: 300,
  maxMinFadeInDelay: 2000
}

const Y_AXIS_PROPS: YAxisProps = {
  horizontalLineWidth: 0,
  verticalLineWidth: 0
}

const PULSE_CURSOR_RADIUS = 6

const BUTTON_MARGINS = [0, 0.5, 0, 0.5]

// Gives the formatted timestamp per timespan, using locale-specific formatting,
// i.e. 'MM/DD' vs 'DD/MM'
const formatTimestamp = (date: Date, timespan: Timespan): { xTooltip: string; xRange: string } => {
  const dateWithYear = formatDate(date, 'P')
  const time = formatDate(date, 'p')
  const dateTime = `${dateWithYear} ${time}`

  switch (timespan) {
    case 'year':
    case 'month':
      return { xTooltip: dateWithYear, xRange: dateWithYear }
    case 'week':
      return { xTooltip: dateTime, xRange: dateWithYear }
    case 'day':
      return { xTooltip: dateTime, xRange: dateWithYear }
    // case 'hour':
    default:
      return { xTooltip: dateTime, xRange: time }
  }
}

// Reduce the number of datapoints to improve loading performance
const reduceChartData = (chartData: ChartDataPoint[], timespan: Timespan): ChartDataPoint[] => {
  // Reduce 'candle' size
  let everyNPoints = 1
  switch (timespan) {
    case 'year': // raw: 1d target: 1w
      everyNPoints = 7
      break
    case 'month': // raw: 1h target: 12h
      everyNPoints = 12
      break
    case 'week': // raw: 1h target: 4h
      everyNPoints = 4
      break
    case 'day': // raw: 5m target: 30m
      everyNPoints = 6
      break
    default:
      everyNPoints = 1
  }

  return chartData.filter((dataPoint: ChartDataPoint, index: number) => index % everyNPoints === 0)
}

const SwipeChartComponent = (params: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { assetId, currencyCode, fiatCurrencyCode } = params

  // #region Chart setup

  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [cachedTimespanChartData, setCachedChartData] = React.useState<Map<Timespan, ChartDataPoint[] | undefined>>(
    new Map<Timespan, ChartDataPoint[] | undefined>([
      ['hour', undefined],
      ['week', undefined],
      ['month', undefined],
      ['year', undefined]
    ])
  )
  const [selectedTimespan, setSelectedTimespan] = React.useState<Timespan>('month')
  const [queryFromTimeOffset, setQueryFromTimeOffset] = React.useState(UNIX_SECONDS_MONTH_OFFSET)
  const [isLoading, setIsLoading] = React.useState(false)

  const chartWidth = React.useRef(0)
  const chartHeight = React.useRef(0)

  const fiatSymbol = React.useMemo(() => getFiatSymbol(fiatCurrencyCode), [fiatCurrencyCode])

  // Min/Max Price Calcs
  const prices = React.useMemo(() => chartData.map(dataPoint => dataPoint.y), [chartData])
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const sMinPriceLabelX = useSharedValue(0)
  const sMinPriceLabelY = useSharedValue(0)
  const sMaxPriceLabelX = useSharedValue(0)
  const sMaxPriceLabelY = useSharedValue(0)

  const sMinPriceString = useSharedValue(``)
  const sMaxPriceString = useSharedValue(``)

  const chartYRange = React.useMemo<[number, number]>(() => [minPrice - (maxPrice - minPrice) * 0.15, maxPrice], [minPrice, maxPrice])

  const minPriceDataPoint = React.useMemo(() => chartData.find(point => point.y === minPrice), [chartData, minPrice])
  const maxPriceDataPoint = React.useMemo(() => chartData.find(point => point.y === maxPrice), [chartData, maxPrice])

  // Fetch/cache chart data, set shared animation transition values
  useAsyncEffect(
    async () => {
      if (!isLoading) {
        setIsLoading(true)
        setChartData([])
        sMinMaxOpacity.value = 0

        // Use cached data, if available
        const cachedChartData = cachedTimespanChartData.get(selectedTimespan)

        const delayShowMinMaxLabels = () => {
          // Delay the appearance of the min/max price labels while the chart
          // price line finishes its entering animation
          sMinMaxOpacity.value = withDelay(ANIMATION_DURATION.maxMinFadeInDelay, withTiming(1, { duration: ANIMATION_DURATION.maxMinFadeIn }))
        }

        try {
          if (cachedChartData != null) {
            // The chart price line animation is slow when transitioning directly
            // between datasets.
            // Add a delay so the component can get re-mounted with fresh data
            // instead.
            setTimeout(() => {
              setChartData(cachedChartData)
              setIsLoading(false)
              delayShowMinMaxLabels()
            }, 10)
          } else {
            const unixNow = Math.trunc(new Date().getTime() / 1000)
            const fromParam = unixNow - queryFromTimeOffset
            const fetchPath = sprintf(MARKET_CHART_ENDPOINT_4S, assetId, fiatCurrencyCode, fromParam, unixNow)
            // Start with the free base URL
            let fetchUrl = `${COINGECKO_URL}${fetchPath}`
            do {
              // Construct the dataset query
              const response = await fetch(fetchUrl)
              const result = await response.json()
              const marketChartRange = asCoinGeckoMarketApi(result)
              if ('status' in marketChartRange) {
                if (marketChartRange.status.error_code === 429) {
                  // Rate limit error, use our API key as a fallback
                  if (!fetchUrl.includes('x_cg_pro_api_key')) {
                    fetchUrl = `${COINGECKO_URL_PRO}${fetchPath}&x_cg_pro_api_key=${ENV.COINGECKO_API_KEY}`
                    continue
                  }
                } else {
                  throw new Error(JSON.stringify(marketChartRange))
                }
              } else {
                const rawChartData = marketChartRange.prices.map(rawDataPoint => {
                  return {
                    x: new Date(rawDataPoint[0]),
                    y: rawDataPoint[1]
                  }
                })
                const reducedChartData = reduceChartData(rawChartData, selectedTimespan)

                setChartData(reducedChartData)
                cachedTimespanChartData.set(selectedTimespan, reducedChartData)
                setCachedChartData(cachedTimespanChartData)
                setIsLoading(false)
                delayShowMinMaxLabels()
                break
              }
            } while (true)
          }
        } catch (e: any) {
          showWarning(`Failed to retrieve market data for ${currencyCode}.`)
          console.error(JSON.stringify(e))
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [selectedTimespan],
    'swipeChart'
  )

  React.useEffect(() => {
    if (chartData.length > 0) {
      rPriceCursorWidth.current = 0
      rXTooltipWidth.current = 0
      sMinPriceString.value = `${fiatSymbol}${formatFiatString({ fiatAmount: minPrice.toString(), autoPrecision: true })}`
      sMaxPriceString.value = `${fiatSymbol}${formatFiatString({ fiatAmount: maxPrice.toString(), autoPrecision: true })}`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData])

  // #endregion Chart setup

  // #region Animations

  const AnimatedCircle = Animated.createAnimatedComponent(Circle)

  const rIsShowCursor = React.useRef<boolean>(false)
  const rXTooltipView = React.useRef<View>(null)
  const rXTooltipWidth = React.useRef<number>(0)
  const rPriceCursorView = React.useRef<View>(null)
  const rPriceCursorWidth = React.useRef<number>(0)

  const rMinPriceView = React.useRef<Animated.View>(null)
  const rMaxPriceView = React.useRef<Animated.View>(null)

  const sPriceValString = useSharedValue('0')
  const sXTooltipString = useSharedValue('')
  const sXTooltipPos = useSharedValue(0)

  const sCursorOpacity = useSharedValue(0)
  const sPulseRMultiplier = useSharedValue(0)
  const sMinMaxOpacity = useSharedValue(0)

  // Overall style for fading in/out all cursor components when gesture is active
  const aGestureFadeStyle = useAnimatedStyle(() => ({
    opacity: sCursorOpacity.value
  }))

  // A delayed fadein for the max/min labels, to ensure the labels don't get
  // rendered before the price line. Also hidden when gesture is active
  const aMinLabelStyle = useAnimatedStyle(() => ({
    left: sMinPriceLabelX.value,
    top: sMinPriceLabelY.value,
    opacity: sMinMaxOpacity.value * (1 - sCursorOpacity.value)
  }))
  const aMaxLabelStyle = useAnimatedStyle(() => ({
    left: sMaxPriceLabelX.value,
    top: sMaxPriceLabelY.value,
    opacity: sMinMaxOpacity.value * (1 - sCursorOpacity.value)
  }))

  // Pulsing price line cursor
  React.useEffect(() => {
    sPulseRMultiplier.value = withRepeat(withTiming(1, { duration: ANIMATION_DURATION.cursorPulse, easing: Easing.linear }), -1, false)
  }, [sPulseRMultiplier])

  const aInnerPulseStyle: Animated.AnimateProps<CircleProps> = useAnimatedProps(() => ({
    r: sPulseRMultiplier.value * PULSE_CURSOR_RADIUS,
    opacity: sCursorOpacity.value
  }))
  const aOuterPulseStyle: Animated.AnimateProps<CircleProps> = useAnimatedProps(() => ({
    r: PULSE_CURSOR_RADIUS + sPulseRMultiplier.value * PULSE_CURSOR_RADIUS,
    opacity: (1 - sPulseRMultiplier.value) * sCursorOpacity.value
  }))

  // X axis labels
  const aXTooltipStyle = useAnimatedStyle(() => ({
    left: sXTooltipPos.value,
    opacity: sCursorOpacity.value
  }))
  const aXEndLabelStyle = useAnimatedStyle(() => ({
    opacity: 1 - sCursorOpacity.value
  }))

  // Dynamic styles
  const cursorOuterStyle = React.useMemo(() => [aGestureFadeStyle, styles.baseCursor], [aGestureFadeStyle, styles.baseCursor])
  const cursorPriceStyle = React.useMemo(() => [aGestureFadeStyle, styles.labelPrimary], [aGestureFadeStyle, styles.labelPrimary])
  const cursorXTooltipStyle = React.useMemo(() => [styles.xTooltip, aXTooltipStyle, aGestureFadeStyle], [aGestureFadeStyle, aXTooltipStyle, styles.xTooltip])
  const minPriceLabelStyle = React.useMemo(() => [aMinLabelStyle, styles.minMaxPriceLabel], [aMinLabelStyle, styles.minMaxPriceLabel])
  const maxPriceLabelStyle = React.useMemo(() => [aMaxLabelStyle, styles.minMaxPriceLabel], [aMaxLabelStyle, styles.minMaxPriceLabel])
  const xRangeLabelStyle = React.useMemo(() => [styles.xEndLabels, aXEndLabelStyle], [aXEndLabelStyle, styles.xEndLabels])

  // #endregion Animations

  // #region Handlers

  const handleGradient = useHandler((props: GradientProps) => {
    return (
      <LinearGradient x1="50%" y1="0%" x2="50%" y2="100%" {...props}>
        <Stop stopColor={theme.iconTappable} offset="0%" stopOpacity="0.5" />
        <Stop stopColor={theme.iconTappable} offset="100%" stopOpacity="0" />
      </LinearGradient>
    )
  })

  /**
   * Handle the layout event on the chart, set the min price label Y value.
   */
  const handleSetChartDimensions = useHandler((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    chartWidth.current = width
    chartHeight.current = height
    sMinPriceLabelY.value = Platform.OS === 'ios' ? chartHeight.current - theme.rem(2.5) : chartHeight.current - theme.rem(2.75)
  })

  /**
   * Handle the tap and hold gesture event on the chart.
   *
   * sIsShowCursor is used as an optimization since handleToolTipTextRenderer()
   * is triggered repeatedly during the price line animation when chart dataset
   * is updated during scene initialization or timespan changes.
   *
   * This can cause sluggishness during those updates.
   *
   * We only care about those callbacks when it's triggered by the gesture, not
   * by each tick of the builtin price line entering animation sequence.
   */
  const handleShowIndicatorCallback = useHandler((opacity: number) => {
    const isShowIndicator = opacity === 1
    rIsShowCursor.current = isShowIndicator
    sCursorOpacity.value = withTiming(isShowIndicator ? 1 : 0, {
      duration: isShowIndicator ? ANIMATION_DURATION.cursorFadeIn : ANIMATION_DURATION.cursorFadeOut
    })
  })

  /**
   * Update a shared X position equal to that of the active slide gesture
   */
  const handleToolTipTextRenderer = useHandler((toolTipTextRenderersInput: ToolTipTextRenderersInput) => {
    if (rIsShowCursor.current) sXTooltipPos.value = toolTipTextRenderersInput.x

    // The SDK's API requires this return value even though we're not using it.
    return { text: '' }
  })

  /**
   * X axis date tooltip display value updates
   */
  const handleDateCallbackWithX = useHandler((x: number | Date) => {
    if (rIsShowCursor.current) {
      const newXTooltipText = formatTimestamp(new Date(x), selectedTimespan).xTooltip
      if (sXTooltipString.value !== newXTooltipText) sXTooltipString.value = newXTooltipText
    }
  })

  /**
   * Price value tooltip display value updates
   */
  const handlePriceCallbackWithY = useHandler((y: number) => {
    if (rIsShowCursor.current) {
      const newDisplayPrice = `${fiatSymbol}${formatFiatString({ fiatAmount: y.toString(), noGrouping: false, autoPrecision: true })}`
      if (newDisplayPrice !== sPriceValString.value) sPriceValString.value = newDisplayPrice
    }
  })

  /**
   * Set the X axis position of the min/max labels. Left or right justify the
   * label according to its horizontal position on the chart
   */
  const setMinMaxLabelsX = (xSharedVal: SharedValue<number>, priceDatapoint?: ChartDataPoint) => (layoutChangeEvent: LayoutChangeEvent) => {
    if (layoutChangeEvent != null && layoutChangeEvent.nativeEvent != null && minPriceDataPoint != null && chartData != null && priceDatapoint != null) {
      const xIndex = chartData.indexOf(priceDatapoint)
      const xPosition = (chartWidth.current / (chartData.length - 1)) * xIndex
      const labelWidth = layoutChangeEvent.nativeEvent.layout.width
      const isRightJustified = xPosition > chartData.length / 2

      xSharedVal.value = isRightJustified ? xPosition - labelWidth : xPosition
    }
  }

  const handleAlignCursorLayout = useHandler(nativeCenterAlignLayout(rPriceCursorWidth, rPriceCursorView, PULSE_CURSOR_RADIUS * 2))
  const handleAlignXTooltipLayout = useHandler(nativeCenterAlignLayout(rXTooltipWidth, rXTooltipView))

  const handleAlignMinPriceLabelLayout = useHandler(setMinMaxLabelsX(sMinPriceLabelX, minPriceDataPoint))
  const handleAlignMaxPriceLabelLayout = useHandler(setMinMaxLabelsX(sMaxPriceLabelX, maxPriceDataPoint))

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

  // #region Memoized SlideAreaChart props

  const renderCursor = useHandler((props: CursorProps & { ref: React.RefObject<any> }) => {
    const { ref } = props
    const circleRadius = PULSE_CURSOR_RADIUS * 2

    return (
      <Animated.View ref={ref} style={cursorOuterStyle}>
        <View
          ref={rPriceCursorView}
          // An adjustment is needed for this center layout because the whole
          // view is already shifted left to center the animated circle by the
          // 'cursorMarkerWidth' SlideChart prop
          onLayout={handleAlignCursorLayout}
        >
          <ReText text={sPriceValString} style={cursorPriceStyle} />
        </View>
        <Svg style={styles.cursorDot}>
          <AnimatedCircle x={circleRadius} y={circleRadius} fill={theme.iconTappable} animatedProps={aInnerPulseStyle} />
          <AnimatedCircle x={circleRadius} y={circleRadius} fill={theme.iconTappable} animatedProps={aOuterPulseStyle} />
        </Svg>
      </Animated.View>
    )
  })

  const renderTimespanButton = useHandler((label: string, timespanKey: Timespan, onPress: () => void) => (
    <MinimalButton
      key={timespanKey}
      marginRem={BUTTON_MARGINS}
      label={label}
      highlighted={selectedTimespan === timespanKey}
      onPress={onPress}
      disabled={isLoading}
    />
  ))

  const cursorProps = React.useMemo<CursorProps>(
    () => ({
      cursorColor: theme.iconTappable,
      cursorLine: true,
      // Offsets to apply to our custom cursor to ensure it stays centered
      // over the vertical line that appears during gestures:
      cursorMarkerWidth: 24, // Pulsing dot dimensions
      cursorMarkerHeight: Platform.OS === 'android' ? theme.rem(4.25) : theme.rem(3.5),
      cursorWidth: 1, // Vertical line dimensions

      renderCursorMarker: renderCursor
    }),
    [renderCursor, theme]
  )

  const tooltipProps = React.useMemo<ToolTipProps>(
    () => ({
      displayToolTip: false, // disasble the SDK's builtin tooltip renderer
      toolTipTextRenderers: [handleToolTipTextRenderer]
    }),
    [handleToolTipTextRenderer]
  )

  // #endregion Memoized SlideAreaChart props

  // #endregion Handlers

  // Main Render
  return (
    <View style={styles.container}>
      {/* Timespan control bar */}
      <View style={styles.controlBar}>
        {renderTimespanButton(lstrings.coin_rank_hour, 'hour', handleSetTimespanH)}
        {renderTimespanButton(lstrings.coin_rank_day, 'day', handleSetTimespanD)}
        {renderTimespanButton(lstrings.coin_rank_week, 'week', handleSetTimespanW)}
        {renderTimespanButton(lstrings.coin_rank_month, 'month', handleSetTimespanM)}
        {renderTimespanButton(lstrings.coin_rank_year, 'year', handleSetTimespanY)}
      </View>

      {/* Chart */}
      {chartData.length === 0 || isLoading ? (
        <View style={styles.loader} onLayout={handleSetChartDimensions}>
          <FillLoader />
        </View>
      ) : (
        <View>
          <SlideAreaChart
            data={chartData}
            animated
            height={theme.rem(11)}
            chartLineColor={theme.iconTappable}
            chartLineWidth={1.5}
            renderFillGradient={handleGradient}
            paddingBottom={theme.rem(1.5)}
            // Price line has weird uneven margins when unadjusted
            paddingRight={theme.rem(2)}
            paddingLeft={theme.rem(-0.5)}
            yRange={chartYRange}
            xScale="linear"
            yAxisProps={Y_AXIS_PROPS}
            // #region ToolTip
            alwaysShowIndicator={false}
            showIndicatorCallback={handleShowIndicatorCallback}
            callbackWithX={handleDateCallbackWithX}
            callbackWithY={handlePriceCallbackWithY}
            shouldCancelWhenOutside
            cursorProps={cursorProps}
            toolTipProps={tooltipProps}
            // #endregion ToolTip

            style={styles.baseChart}
          />

          {/* Min/Max price labels */}
          <Animated.View ref={rMinPriceView} onLayout={handleAlignMinPriceLabelLayout} style={minPriceLabelStyle}>
            <ReText style={styles.labelPrice} text={sMinPriceString} />
          </Animated.View>
          <Animated.View ref={rMaxPriceView} onLayout={handleAlignMaxPriceLabelLayout} style={maxPriceLabelStyle}>
            <ReText style={styles.labelPrice} text={sMaxPriceString} />
          </Animated.View>
        </View>
      )}

      {/* X-Axis */}
      <View>
        {/* X-Axis Cursor Timestamp Tooltip */}
        <Animated.View style={cursorXTooltipStyle}>
          <View ref={rXTooltipView} onLayout={handleAlignXTooltipLayout} style={Platform.OS === 'ios' ? { marginTop: theme.rem(1.25) } : undefined}>
            <ReText text={sXTooltipString} style={styles.label} />
          </View>
        </Animated.View>

        {/* X-Axis Time Range Static End Labels */}
        {!isLoading && chartData.length > 0 ? (
          <Animated.View style={xRangeLabelStyle}>
            <EdgeText style={styles.labelSecondary}>{formatTimestamp(new Date(chartData[0].x), selectedTimespan).xRange}</EdgeText>
            <EdgeText style={styles.labelSecondary}>{formatTimestamp(new Date(chartData[chartData.length - 1].x), selectedTimespan).xRange}</EdgeText>
          </Animated.View>
        ) : null}
      </View>
    </View>
  )

  // #endregion Components
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    baseChart: {
      marginTop: theme.rem(0),
      backgroundColor: theme.tileBackground,
      borderColor: theme.tileBackground
    },
    baseCursor: {
      alignSelf: 'flex-start',
      position: 'absolute'
    },
    container: {
      margin: theme.rem(0.5)
    },
    controlBar: {
      justifyContent: 'center',
      flexDirection: 'row',
      marginBottom: theme.rem(0.25)
    },
    cursorDot: {
      height: theme.rem(3)
    },
    loader: {
      marginTop: theme.rem(0),
      height: theme.rem(11)
    },
    label: {
      color: theme.primaryText,
      fontSize: theme.rem(0.75)
    },
    labelPrimary: {
      color: theme.primaryText,
      fontSize: theme.rem(0.75),
      fontFamily: theme.fontFaceBold,
      minWidth: theme.rem(1.5)
    },
    labelSecondary: {
      fontSize: theme.rem(0.75),
      color: theme.deactivatedText
    },
    labelPrice: {
      fontSize: theme.rem(0.75),
      color: theme.iconTappable
    },
    minMaxPriceLabel: {
      position: 'absolute'
    },
    xEndLabels: {
      position: 'absolute',
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      bottom: 2,
      paddingLeft: theme.rem(0.25),
      paddingRight: theme.rem(0.25)
    },
    xTooltip: {
      position: 'absolute',
      left: 0,
      bottom: Platform.OS === 'android' ? -10 : 0,
      flexDirection: 'row',
      alignItems: 'center',
      flexGrow: 1,
      height: theme.rem(2.5)
    }
  }
})

/**
 * Natively center align a component across the Y axis origin
 */
const nativeCenterAlignLayout =
  (widthRef: React.MutableRefObject<number>, ref: React.RefObject<View | Animated.View | undefined>, offset?: number) =>
  (layoutChangeEvent: LayoutChangeEvent) => {
    if (layoutChangeEvent != null && layoutChangeEvent.nativeEvent != null) {
      // Store measurements and avoid over-updating if the size of the component
      // doesn't change significantly
      const newWidth = layoutChangeEvent.nativeEvent.layout.width
      if (Math.abs(widthRef.current - newWidth) > 1) {
        widthRef.current = newWidth
        if (ref.current != null) ref.current.setNativeProps({ left: -newWidth / 2 + (offset ?? 0) })
      }
    }
  }

export const SwipeChart = React.memo(SwipeChartComponent)
