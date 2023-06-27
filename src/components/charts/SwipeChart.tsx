import { CursorProps, GradientProps, SlideAreaChart, ToolTipProps, ToolTipTextRenderersInput, YAxisProps } from '@connectedcars/react-native-slide-charts'
import { asArray, asNumber, asObject, asTuple } from 'cleaners'
import * as React from 'react'
import { LayoutChangeEvent, Platform, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated'
import Svg, { Circle, CircleProps, LinearGradient, Stop } from 'react-native-svg'
import { sprintf } from 'sprintf-js'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { formatFiatString } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { formatDate } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { useSelector } from '../../types/reactRedux'
import { MinimalButton } from '../buttons/MinimalButton'
import { FillLoader } from '../progress-indicators/FillLoader'
import { showWarning } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'
import { ReText } from '../text/ReText'
import { EdgeText } from '../themed/EdgeText'

type Timespan = 'year' | 'month' | 'week' | 'day' | 'hour'
type AlignOrigin = 'center' | 'right' | 'left'

interface ChartDataPoint {
  x: Date
  y: number
}
type CoinGeckoDataPair = number[]
interface CoinGeckoMarketChartRange {
  prices: CoinGeckoDataPair[]
  market_caps: CoinGeckoDataPair[]
  total_volumes: CoinGeckoDataPair[]
}
const asCoinGeckoDataPair = asTuple(asNumber, asNumber)
const asCoinGeckoMarketChartRange = asObject<CoinGeckoMarketChartRange>({
  prices: asArray(asCoinGeckoDataPair),
  market_caps: asArray(asCoinGeckoDataPair),
  total_volumes: asArray(asCoinGeckoDataPair)
})

interface Props {
  currencyCode: string
  assetId: string // The asset's 'id' as defined by CoinGecko
}

const DATASET_URL_4S = 'https://api.coingecko.com/api/v3/coins/%1$s/market_chart/range?vs_currency=%2$s&from=%3$s&to=%4$s'
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
  const { assetId, currencyCode } = params

  // #region Chart setup

  const defaultFiat = useSelector(state => getDefaultFiat(state))

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

  const minPriceLabelPosition = React.useRef<{ x: number; y: number; origin: AlignOrigin }>({ x: 0, y: 0, origin: 'left' })
  const maxPriceLabelPosition = React.useRef<{ x: number; y: number; origin: AlignOrigin }>({ x: 0, y: 0, origin: 'left' })
  const chartWidth = React.useRef(0)
  const chartHeight = React.useRef(0)

  const fiatSymbol = React.useMemo(() => getSymbolFromCurrency(defaultFiat), [defaultFiat])

  // Min/Max Price Calcs
  const prices = React.useMemo(() => chartData.map(dataPoint => dataPoint.y), [chartData])
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const sMinPriceString = useSharedValue(``)
  const sMaxPriceString = useSharedValue(``)

  const chartYRange = React.useMemo<[number, number]>(() => [minPrice - (maxPrice - minPrice) * 0.15, maxPrice], [minPrice, maxPrice])

  const minPriceDataPoint = React.useMemo(() => chartData.find(point => point.y === minPrice), [chartData, minPrice])
  const maxPriceDataPoint = React.useMemo(() => chartData.find(point => point.y === maxPrice), [chartData, maxPrice])

  // Fetch/cache chart data, set shared animation transition values
  useAsyncEffect(async () => {
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
          // Construct the dataset query
          const unixNow = Math.trunc(new Date().getTime() / 1000)
          const fromParam = unixNow - queryFromTimeOffset
          const fetchUrl = sprintf(DATASET_URL_4S, assetId, defaultFiat, fromParam, unixNow)
          await fetch(fetchUrl)
            .then(async res => await res.json())
            .then((data: any) => {
              const marketChartRange = asCoinGeckoMarketChartRange(data)
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
            })
        }
      } catch (e: any) {
        showWarning(`Failed to retrieve market data for ${currencyCode}.`)
        console.error(e)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimespan])

  const setMinMaxLabelCoords = () => {
    if (
      chartWidth.current != null &&
      chartHeight.current != null &&
      chartWidth.current > 0 &&
      chartHeight.current > 0 &&
      minPriceDataPoint != null &&
      maxPriceDataPoint != null
    ) {
      const minXIndex = chartData.indexOf(minPriceDataPoint)
      const minXPosition = (chartWidth.current / (chartData.length - 1)) * minXIndex
      const minYPosition = Platform.OS === 'ios' ? chartHeight.current - theme.rem(2.5) : chartHeight.current - theme.rem(2.75)

      const maxXIndex = chartData.indexOf(maxPriceDataPoint)
      const maxXPosition = (chartWidth.current / (chartData.length - 1)) * maxXIndex
      const maxYPosition = theme.rem(0)

      // We want the alignment origin of the element to be on the right edge if
      // it is located on the right half of the chart so that the contents
      // remain visible, and vice versa for the left half of the chart.
      minPriceLabelPosition.current = { x: minXPosition, y: minYPosition, origin: minXIndex > chartData.length / 2 ? 'right' : 'left' }
      maxPriceLabelPosition.current = { x: maxXPosition, y: maxYPosition, origin: maxXIndex > chartData.length / 2 ? 'right' : 'left' }
    }
  }

  React.useEffect(() => {
    sMinPriceString.value = `${fiatSymbol}${formatFiatString({ fiatAmount: minPrice.toString(), autoPrecision: true })}`
    sMaxPriceString.value = `${fiatSymbol}${formatFiatString({ fiatAmount: maxPrice.toString(), autoPrecision: true })}`
    setMinMaxLabelCoords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, maxPriceDataPoint, minPriceDataPoint])

  // #endregion Chart setup

  // #region Animations

  const AnimatedCircle = Animated.createAnimatedComponent(Circle)

  const rIsShowCursor = React.useRef<boolean>(false)
  const rXTooltipView = React.useRef<View>(null)
  const rPriceCursorView = React.useRef<View>(null)
  const rCachedWidths = React.useRef<{ [target: number]: number }>({})

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
    left: minPriceLabelPosition.current.x,
    top: minPriceLabelPosition.current.y,
    opacity: sMinMaxOpacity.value * (1 - sCursorOpacity.value)
  }))
  const aMaxLabelStyle = useAnimatedStyle(() => ({
    left: maxPriceLabelPosition.current.x,
    top: maxPriceLabelPosition.current.y,
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

  const handleShowMinMaxLabelCoords = useHandler((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    chartWidth.current = width
    chartHeight.current = height
    setMinMaxLabelCoords()
  })

  // sIsShowCursor is used as an optimization since handleToolTipTextRenderer()
  // is triggered repeatedly during the price line animation when chart dataset
  // is updated during scene initialization or timespan changes. This can cause
  // sluggishness during those updates.
  // We only care about those callbacks when it's triggered by the gesture, not
  // by the builtin price line entering animation sequence.
  const handleShowIndicatorCallback = useHandler((opacity: number) => {
    const isShowIndicator = opacity === 1
    rIsShowCursor.current = isShowIndicator
    sCursorOpacity.value = withTiming(isShowIndicator ? 1 : 0, {
      duration: isShowIndicator ? ANIMATION_DURATION.cursorFadeIn : ANIMATION_DURATION.cursorFadeOut
    })
  })

  // Update a shared X position equal to that of the active slide gesture
  const handleToolTipTextRenderer = useHandler((toolTipTextRenderersInput: ToolTipTextRenderersInput) => {
    if (rIsShowCursor.current) sXTooltipPos.value = toolTipTextRenderersInput.x

    // The SDK's API requires this return value even though we're not using it.
    return { text: '' }
  })

  // X axis date tooltip display value updates
  const handleDateCallbackWithX = useHandler((x: number | Date) => {
    if (rIsShowCursor.current) {
      const newXTooltipText = formatTimestamp(new Date(x), selectedTimespan).xTooltip
      if (sXTooltipString.value !== newXTooltipText) sXTooltipString.value = newXTooltipText
    }
  })

  // Price value tooltip display value updates
  const handlePriceCallbackWithY = useHandler((y: number) => {
    if (rIsShowCursor.current) {
      const newDisplayPrice = `${fiatSymbol}${formatFiatString({ fiatAmount: y.toString(), noGrouping: false, autoPrecision: true })}`
      if (newDisplayPrice !== sPriceValString.value) sPriceValString.value = newDisplayPrice
    }
  })

  // Natively align a component based on a specified origin
  const nativeAlignLayout =
    (origin: AlignOrigin, ref: React.RefObject<View | Animated.View | undefined>, offset?: number) => (layoutChangeEvent: LayoutChangeEvent) => {
      if (layoutChangeEvent != null && layoutChangeEvent.nativeEvent != null) {
        const target = layoutChangeEvent.target

        // Store measurements and avoid over-updating if the size of the component
        // doesn't change significantly
        const currentWidth = rCachedWidths.current[target]
        const newWidth = layoutChangeEvent.nativeEvent.layout.width
        if (currentWidth == null || Math.abs(currentWidth - newWidth) > 1) {
          rCachedWidths.current[target] = newWidth
          if (ref.current != null) {
            switch (origin) {
              case 'center':
                ref.current.setNativeProps({ left: -newWidth / 2 + (offset ?? 0) })
                break
              case 'right':
                ref.current.setNativeProps({ left: -newWidth + (offset ?? 0) })
                break
              case 'left': // The typical 'default' alignment
                ref.current.setNativeProps({ left: 0 + (offset ?? 0) })
                break
            }
          }
        }
      }
    }

  const handleAlignCursorLayout = useHandler(nativeAlignLayout('center', rPriceCursorView, PULSE_CURSOR_RADIUS * 2))

  const handleAlignMinPriceLabelLayout = useHandler(nativeAlignLayout(minPriceLabelPosition.current.origin, rMinPriceView, minPriceLabelPosition.current.x))

  const handleAlignMaxPriceLabelLayout = useHandler(nativeAlignLayout(maxPriceLabelPosition.current.origin, rMaxPriceView, maxPriceLabelPosition.current.x))

  const handleAlignXTooltipLayout = useHandler(nativeAlignLayout('center', rXTooltipView))

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
        <View style={styles.loader} onLayout={handleShowMinMaxLabelCoords}>
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

export const SwipeChart = React.memo(SwipeChartComponent)
