import { div, lt, round } from 'biggystring'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import { getSymbolFromCurrency } from '../../../constants/WalletAndCurrencyConstants'
import { formatFiatString } from '../../../hooks/useFiatText'
import { useHandler } from '../../../hooks/useHandler'
import { toPercentString } from '../../../locales/intl'
import { getDefaultFiat } from '../../../selectors/SettingsSelectors'
import { AssetSubText, CoinRanking, CoinRankingData, PercentChangeTimeFrame } from '../../../types/coinrankTypes'
import { useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp } from '../../../types/routerTypes'
import { triggerHaptic } from '../../../util/haptic'
import { debugLog, LOG_COINRANK } from '../../../util/logger'
import { DECIMAL_PRECISION } from '../../../util/utils'
import { Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'

interface Props {
  navigation: NavigationProp<'coinRanking'>
  index: number
  percentChangeTimeFrame: PercentChangeTimeFrame
  assetSubText: AssetSubText
  coinRanking: CoinRanking
}

const MIN_REFRESH_INTERVAL = 30000
const REFRESH_INTERVAL_RANGE = 10000

type Timeout = ReturnType<typeof setTimeout>

const CoinRankRowComponent = (props: Props) => {
  const { navigation, index, percentChangeTimeFrame, assetSubText, coinRanking } = props
  const { coinRankingDatas } = coinRanking

  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const fiatSymbol = React.useMemo(() => getSymbolFromCurrency(defaultFiat), [defaultFiat])

  const mounted = React.useRef<boolean>(true)
  const timeoutHandler = React.useRef<Timeout | undefined>()

  const theme = useTheme()
  const styles = getStyles(theme)
  const [coinRow, setCoinRow] = useState<CoinRankingData | undefined>(coinRankingDatas[index])

  const handlePress = useHandler(() => {
    triggerHaptic('impactLight')
    navigation.navigate('coinRankingDetails', { coinRankingData: coinRankingDatas[index] })
  })

  React.useEffect(() => {
    const newTimer = () => {
      const nextRefresh = MIN_REFRESH_INTERVAL + Math.random() * REFRESH_INTERVAL_RANGE
      timeoutHandler.current = setTimeout(loop, nextRefresh)
    }
    const loop = () => {
      if (!mounted.current) return
      const newCoinRow = coinRankingDatas[index]
      if (newCoinRow == null) return newTimer()
      if (coinRow == null) {
        debugLog(LOG_COINRANK, `New Row ${index} ${newCoinRow.currencyCode}`)
        setCoinRow(newCoinRow)
        return newTimer()
      }

      const { percentChange: newPercentChange, price: newPrice, currencyCode: newCurrencyCode } = newCoinRow
      const { percentChange, price, currencyCode } = coinRow
      const pctf = percentChange[percentChangeTimeFrame]
      const newPctf = newPercentChange[percentChangeTimeFrame]

      if (newPrice !== price || pctf !== newPctf || currencyCode !== newCurrencyCode) {
        debugLog(LOG_COINRANK, `Refresh Row ${index} old: ${currencyCode} ${price} ${pctf}`)
        debugLog(LOG_COINRANK, `            ${index} new: ${newCurrencyCode} ${newPrice} ${newPctf}`)
        setCoinRow(newCoinRow)
      }
      newTimer()
    }
    loop()
    return () => {
      clearTimeout(timeoutHandler.current)
      mounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const imageUrlObject = React.useMemo(
    () => ({
      uri: coinRow?.imageUrl ?? ''
    }),
    [coinRow]
  )

  if (coinRow == null) return null

  const { currencyCode, price, marketCap, volume24h, percentChange, rank } = coinRow
  debugLog(LOG_COINRANK, `CoinRankRow index=${index} rank=${rank} currencyCode=${currencyCode}`)

  let numDecimals
  let assetSubTextValue

  // Calculate market cap string
  if (assetSubText === 'marketCap') {
    assetSubTextValue = marketCap
  } else {
    assetSubTextValue = volume24h
  }

  let assetSubTextScaled
  let assetSubTextDenom
  if (assetSubTextValue > 1000000000) {
    assetSubTextScaled = assetSubTextValue / 1000000000
    assetSubTextDenom = 'B'
  } else if (assetSubTextValue > 1000000) {
    assetSubTextScaled = assetSubTextValue / 1000000
    assetSubTextDenom = 'M'
  } else if (assetSubTextValue > 1000) {
    assetSubTextScaled = assetSubTextValue / 1000
    assetSubTextDenom = 'K'
  } else {
    assetSubTextScaled = assetSubTextValue
    assetSubTextDenom = ''
  }

  numDecimals = getNumDecimals(assetSubTextScaled)
  const assetSubTextValueString = round(assetSubTextScaled.toString(), -numDecimals)
  const assetSubTextString = `${fiatSymbol}${assetSubTextValueString} ${assetSubTextDenom}`

  // Calculate percent change string
  const percentChangeRaw = percentChange[percentChangeTimeFrame]
  numDecimals = getNumDecimals(percentChangeRaw, 2)

  const decimalChangeRaw = div(String(percentChangeRaw), '100', DECIMAL_PRECISION)
  const percentChangeString = toPercentString(decimalChangeRaw, { noGrouping: true })
  const negative = lt(percentChangeString, '0')

  // Calculate price string
  numDecimals = getNumDecimals(price)
  const priceStyle = negative ? styles.negativeText : styles.positiveText
  const plusMinus = negative ? '' : '+'
  const priceString = `${fiatSymbol}${formatFiatString({ fiatAmount: price.toString() })}`
  const percentString = `${plusMinus}${percentChangeString}`

  return (
    <TouchableOpacity accessible={false} style={styles.container} onPress={handlePress}>
      <View style={styles.rank}>
        <EdgeText accessible numberOfLines={1} disableFontScaling>
          {rank}
        </EdgeText>
      </View>
      <View style={styles.iconRowDataContainer}>
        <FastImage style={styles.icon} source={imageUrlObject} />
        <View style={styles.leftColumn}>
          <EdgeText style={styles.currencyCode}>{currencyCode.toUpperCase()}</EdgeText>
          <EdgeText style={styles.assetSubText}>{assetSubTextString}</EdgeText>
        </View>
        <View style={styles.middleColumn}>
          <EdgeText style={priceStyle}>{percentString}</EdgeText>
        </View>
        <View style={styles.rightColumn}>
          <EdgeText style={priceStyle}>{priceString}</EdgeText>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export const CoinRankRow = React.memo(CoinRankRowComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row'
  },
  iconRowDataContainer: {
    padding: theme.rem(0.75),
    paddingLeft: theme.rem(0.25),
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: theme.rem(0)
  },
  currencyCode: {
    width: theme.rem(5)
  },
  rank: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: theme.rem(1),
    width: theme.rem(2.5)
  },
  icon: {
    width: theme.rem(1.5),
    height: theme.rem(1.5)
  },
  iconRow: {
    paddingLeft: theme.rem(0),
    paddingRight: theme.rem(0),
    flex: 1
  },
  negativeText: {
    color: theme.negativeText
  },
  positiveText: {
    color: theme.positiveText
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  middleColumn: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'column'
  },
  leftColumn: {
    flexDirection: 'column',
    flexShrink: 1,
    marginLeft: theme.rem(1),
    width: theme.rem(4.5)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  assetSubText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

// Get the number of decimals to show to represent a desired number of
// significant digits. Defaults to 3 significant digits
const getNumDecimals = (value: number, precision: number = 3): number => {
  const l10 = Math.floor(Math.log10(Math.abs(value)))
  let numDecimals = 0
  numDecimals = Math.min(l10 - precision + 1, 0)
  numDecimals = Math.abs(numDecimals)
  return numDecimals
}
