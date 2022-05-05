// @flow

import { abs, div, gt, mul, sub, toFixed } from 'biggystring'
import * as React from 'react'
import { StyleSheet } from 'react-native'

import { useFiatText } from '../../../hooks/useFiatText'
import { truncateDecimals } from '../../../locales/intl'
import { getExchangeDenominationFromState } from '../../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { type GuiExchangeRates } from '../../../types/types'
import { fixFiatCurrencyCode, zeroString } from '../../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'

type Props = {
  walletId: string,
  style?: StyleSheet.styles,
  tokenId: string
}

type GetDifferenceParams = {
  exchangeRate: string,
  currencyCode: string,
  exchangeRates: GuiExchangeRates,
  fiatExchangeRate: string
}

const getYesterdayDateRoundDownHour = () => {
  const date = new Date()
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  const yesterday = date.setDate(date.getDate() - 1)
  return new Date(yesterday).toISOString()
}

const getPercentDeltaString = ({ currencyCode, exchangeRate, exchangeRates, fiatExchangeRate = '0' }: GetDifferenceParams) => {
  // Create the default empty result function
  const result = (value, deltaColorStyle = 'neutral') => ({
    percentString: value != null ? `${value}%` : '',
    deltaColorStyle
  })

  // Yesterdays Exchange Rate
  const currencyPair = `${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`
  const yesterdayUsdExchangeRate = toFixed(exchangeRates[currencyPair] ?? '0', 0, 2)
  const yesterdayExchangeRate = mul(yesterdayUsdExchangeRate, fiatExchangeRate)

  // Return the Exchange Rate without `percentageString` in case we are missing yesterday's rate
  if (zeroString(yesterdayExchangeRate)) return result()
  // Calculate the percentage difference in rate between yesterday and today
  const differenceYesterday = sub(exchangeRate, yesterdayExchangeRate)
  const differencePercentage = mul(div(differenceYesterday, yesterdayExchangeRate, 3), '100')

  // Return zero result
  if (zeroString(differencePercentage)) return result('0.00')

  // If not zero, create the `percentageString`
  const percentString = abs(differencePercentage)

  // Return Positive result if greater then zero
  if (gt(differencePercentage, '0')) return result(`+${percentString}`, 'positive')

  // If it's not zero or positive, it must be a Negative result
  return result(`-${percentString}`, 'negative')
}

/**
 * Returns a text string that displays the crypto-fiat exchange rate and the
 * daily % change from a wallet asset
 **/
export const TickerText = ({ walletId, style, tokenId }: Props) => {
  const dispatch = useDispatch()
  const styles = getStyles(useTheme())

  const fiatCurrencyCode = useSelector(state => state.core.account.currencyWallets[walletId].fiatCurrencyCode)
  const currencyInfo = useSelector(state => state.core.account.currencyWallets[walletId].currencyInfo)
  const tokenOrNativeCode = tokenId ?? currencyInfo.currencyCode
  const exchangeDenomination = dispatch(getExchangeDenominationFromState(currencyInfo.pluginId, tokenOrNativeCode))

  const cryptoExchangeMultiplier = exchangeDenomination.multiplier
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)
  const rateKey = `${tokenOrNativeCode}_${isoFiatCurrencyCode}`
  const exchangeRates = useSelector(state => state.exchangeRates)
  const exchangeRate = !zeroString(exchangeRates[rateKey]) ? exchangeRates[rateKey] : '1'

  let fiatText = useFiatText({
    nativeCryptoAmount: cryptoExchangeMultiplier,
    cryptoCurrencyCode: tokenOrNativeCode,
    isoFiatCurrencyCode,
    autoPrecision: true,
    cryptoExchangeMultiplier
  })

  // Drop decimals if over '1000' of any fiat currency
  if (Math.log10(parseFloat(exchangeRate)) >= 3) fiatText = truncateDecimals(fiatText, 0)

  const { percentString, deltaColorStyle } = getPercentDeltaString({
    exchangeRate,
    currencyCode: tokenOrNativeCode,
    exchangeRates,
    fiatExchangeRate: isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${isoFiatCurrencyCode}`] : '1'
  })
  const tickerText = `${fiatText} ${percentString}`
  return <EdgeText style={[style, styles[deltaColorStyle]]}>{tickerText}</EdgeText>
}

const getStyles = cacheStyles((theme: Theme) => ({
  neutral: {
    color: theme.secondaryText
  },
  positive: {
    color: theme.positiveText
  },
  negative: {
    color: theme.negativeText
  }
}))
