import { lt, round } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import { CoinRow, CoinRowData, PercentChangeTimeFrame, PriceSubText } from '../../../types/coinrankTypes'
import { useState } from '../../../types/reactHooks'
import { debugLog, LOG_COINRANK } from '../../../util/logger'
import { Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'

interface Props {
  index: number
  percentChangeTimeFrame: PercentChangeTimeFrame
  priceSubText: PriceSubText
  coinRowData: CoinRowData
}

const MIN_REFRESH_INTERVAL = 30000
const REFRESH_INTERVAL_RANGE = 10000

type Timeout = ReturnType<typeof setTimeout>

const CoinRankRowComponent = (props: Props) => {
  const { index, percentChangeTimeFrame, priceSubText, coinRowData } = props
  const { coinRankings } = coinRowData

  const mounted = React.useRef<boolean>(true)
  const timeoutHandler = React.useRef<Timeout | undefined>()

  const theme = useTheme()
  const styles = getStyles(theme)
  const [coinRow, setCoinRow] = useState<CoinRow | undefined>(coinRankings[index])

  React.useEffect(() => {
    const newTimer = () => {
      const nextRefresh = MIN_REFRESH_INTERVAL + Math.random() * REFRESH_INTERVAL_RANGE
      timeoutHandler.current = setTimeout(loop, nextRefresh)
    }
    const loop = () => {
      if (!mounted.current) return
      const newCoinRow = coinRankings[index]
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
  }, [])

  const imageUrlObject = React.useMemo(
    () => ({
      uri: coinRow?.imageUrl ?? ''
    }),
    [coinRow]
  )

  if (coinRow == null) return null

  const { currencyCode, currencyName, price, marketCap, volume24h, percentChange, rank } = coinRow
  debugLog(LOG_COINRANK, `CoinRankRow index=${index} rank=${rank} currencyCode=${currencyCode}`)

  const fiatSymbol = '$'

  let numDecimals
  let priceSubTextValue

  // Calculate market cap string
  if (priceSubText === 'marketCap') {
    priceSubTextValue = marketCap
  } else {
    priceSubTextValue = volume24h
  }

  let priceSubTextScaled
  let priceSubTextDenom
  if (priceSubTextValue > 1000000000) {
    priceSubTextScaled = priceSubTextValue / 1000000000
    priceSubTextDenom = 'B'
  } else if (priceSubTextValue > 1000000) {
    priceSubTextScaled = priceSubTextValue / 1000000
    priceSubTextDenom = 'M'
  } else if (priceSubTextValue > 1000) {
    priceSubTextScaled = priceSubTextValue / 1000
    priceSubTextDenom = 'K'
  } else {
    priceSubTextScaled = priceSubTextValue
    priceSubTextDenom = ''
  }

  numDecimals = getNumDecimals(priceSubTextScaled)
  const priceSubTextValueString = round(priceSubTextScaled.toString(), -numDecimals)
  const priceSubTextString = `${fiatSymbol}${priceSubTextValueString} ${priceSubTextDenom}`

  // Calculate percent change string
  const percentChangeRaw = percentChange[percentChangeTimeFrame]
  numDecimals = getNumDecimals(percentChangeRaw, 2)
  const percentChangeString = round(percentChangeRaw.toString(), -numDecimals)
  const negative = lt(percentChangeString, '0')

  // Calculate price string
  numDecimals = getNumDecimals(price)
  const priceStyle = negative ? styles.negativeText : styles.positiveText
  const plusMinus = negative ? '' : '+'
  const priceString = `${fiatSymbol}${round(price.toString(), -numDecimals)}`
  const percentString = `${plusMinus}${percentChangeString}%`

  return (
    <View style={styles.container}>
      <View style={styles.rank}>
        <EdgeText>{rank}</EdgeText>
      </View>
      <View style={styles.iconRowDataContainer}>
        <FastImage style={styles.icon} source={imageUrlObject} />
        <View style={styles.leftColumn}>
          <View style={styles.row}>
            <EdgeText style={styles.currencyCode}>{currencyCode.toUpperCase()}</EdgeText>
            <EdgeText style={priceStyle}>{percentString}</EdgeText>
          </View>
          <EdgeText style={styles.currencyName}>{currencyName}</EdgeText>
        </View>
        <View style={styles.rightColumn}>
          <EdgeText style={priceStyle}>{priceString}</EdgeText>
          <View style={styles.row}>
            <EdgeText style={styles.priceSubText}>{priceSubTextString}</EdgeText>
          </View>
        </View>
      </View>
    </View>
  )
}

export const CoinRankRow = React.memo(CoinRankRowComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row'
  },
  iconRowDataContainer: {
    paddingLeft: theme.rem(0),
    paddingRight: theme.rem(0),
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: theme.rem(0.75)
  },
  currencyCode: {
    width: theme.rem(5)
  },
  rank: {
    justifyContent: 'center',
    width: theme.rem(2),
    paddingLeft: theme.rem(1)
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
    flexDirection: 'column'
  },
  leftColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.25),
    marginLeft: theme.rem(1)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  currencyName: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  priceSubText: {
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
