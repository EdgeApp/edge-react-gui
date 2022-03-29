// @flow

import { abs, div, gt, log10, mul, sub, toFixed } from 'biggystring'
import { type EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useFiatText } from '../../hooks/useFiatText.js'
import { formatNumber } from '../../locales/intl.js'
import { getDisplayDenominationFromState, getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
import { memo } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type GuiExchangeRates } from '../../types/types.js'
import {
  DECIMAL_PRECISION,
  decimalOrZero,
  DEFAULT_TRUNCATE_PRECISION,
  fixFiatCurrencyCode,
  getCurrencyInfo,
  getDenomFromIsoCode,
  getYesterdayDateRoundDownHour,
  maxPrimaryCurrencyConversionDecimals,
  precisionAdjust,
  truncateDecimals,
  zeroString
} from '../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletListRow } from './WalletListRow.js'
import { WalletProgressIcon } from './WalletProgressIcon.js'

type Props = {
  currencyCode: string,
  gradient?: boolean,
  onPress?: () => void,
  onLongPress?: () => void,
  showRate?: boolean,
  walletId: string,
  // eslint-disable-next-line react/no-unused-prop-types
  walletName?: string
}

type GetDifferenceParams = {
  exchangeRate: string,
  currencyCode: string,
  exchangeRates: GuiExchangeRates,
  fiatExchangeRate: string
}

type GetCryptoAmountParams = {
  balance: string,
  exchangeRate: string,
  exchangeDenomination: EdgeDenomination,
  fiatDenomination: EdgeDenomination,
  denomination: EdgeDenomination,
  currencyCode: string
}

export const getCryptoAmount = ({ balance, exchangeRate, exchangeDenomination, fiatDenomination, denomination, currencyCode }: GetCryptoAmountParams) => {
  if (zeroString(balance)) return '0'
  let maxConversionDecimals = DEFAULT_TRUNCATE_PRECISION
  const { multiplier, symbol } = denomination

  if (exchangeRate) {
    const precisionAdjustValue = precisionAdjust({
      primaryExchangeMultiplier: exchangeDenomination.multiplier,
      secondaryExchangeMultiplier: fiatDenomination.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRate
    })
    maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(log10(multiplier), precisionAdjustValue)
  }

  try {
    const preliminaryCryptoAmount = truncateDecimals(div(balance, multiplier, DECIMAL_PRECISION), maxConversionDecimals)
    const finalCryptoAmount = formatNumber(decimalOrZero(preliminaryCryptoAmount, maxConversionDecimals)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    return `${symbol ? symbol + ' ' : ''}${finalCryptoAmount}`
  } catch (error) {
    if (error.message === 'Cannot operate on base16 float values') {
      const errorMessage = `${error.message}: Currency code - ${currencyCode}, balance - ${balance}, demonination multiplier: ${multiplier}`
      console.error(errorMessage)
    }
    console.error(error)
  }

  return ''
}

export const getDifference = (getRateParams: GetDifferenceParams) => {
  const { currencyCode, exchangeRate, exchangeRates, fiatExchangeRate = '0' } = getRateParams
  // Create the default empty result function
  const result = (...args) => ({
    differencePercentageString: args[0] ? `${args[0]}%` : '',
    differencePercentageStyle: args[1] ?? 'neutral'
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
  const percentageString = abs(differencePercentage)
  // Return Positive result if greater then zero
  if (gt(differencePercentage, '0')) return result(`+${percentageString}`, 'positive')
  // If it's not zero or positive, it must be a Negative result
  return result(`-${percentageString}`, 'negative')
}

export const WalletListCurrencyRow = memo((props: Props) => {
  const { currencyCode, showRate = false, onPress, onLongPress, gradient, walletId, walletName } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const wallet = useSelector(state => state.core.account.currencyWallets[walletId])
  const exchangeRates = useSelector(state => state.exchangeRates)
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const allCurrencyInfos = useSelector(state => state.ui.settings.plugins.allCurrencyInfos)

  const { fiatCurrencyCode, balances, name } = wallet

  // Crypto Amount And Exchange Rate
  const balance = balances[currencyCode]
  const denomination = dispatch(getDisplayDenominationFromState(wallet.currencyInfo.pluginId, currencyCode))
  const exchangeDenomination = dispatch(getExchangeDenominationFromState(wallet.currencyInfo.pluginId, currencyCode))
  const fiatDenomination = getDenomFromIsoCode(fiatCurrencyCode)
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)
  const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
  const exchangeRate = !zeroString(exchangeRates[rateKey]) ? exchangeRates[rateKey] : '1'
  const cryptoExchangeMultiplier = exchangeDenomination.multiplier

  const nativeCryptoAmount = showBalance ? getCryptoAmount({ balance, exchangeRate, exchangeDenomination, fiatDenomination, denomination, currencyCode }) : ''

  const [{ fiatText: fiatBalanceText }] = useFiatText({
    nativeCryptoAmount: balance,
    cryptoCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    cryptoExchangeMultiplier
  })

  const [{ fiatText: exchangeRateText }] = useFiatText({
    nativeCryptoAmount: cryptoExchangeMultiplier,
    cryptoCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    cryptoExchangeMultiplier
  })

  const exchangeData = {
    exchangeRateText,
    exchangeRateType: 'neutral'
  }
  if (showRate) {
    const { differencePercentageString, differencePercentageStyle } = getDifference({
      exchangeRate,
      currencyCode,
      exchangeRates,
      fiatExchangeRate: isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${isoFiatCurrencyCode}`] : '1'
    })
    exchangeData.exchangeRateText = `${exchangeData.exchangeRateText} ${differencePercentageString}`
    exchangeData.exchangeRateType = differencePercentageStyle
  }

  return (
    <WalletListRow
      currencyCode={currencyCode}
      exchangeData={showRate ? exchangeData : null}
      icon={<WalletProgressIcon currencyCode={currencyCode} walletId={walletId} />}
      onPress={onPress ?? (() => {})}
      onLongPress={onLongPress}
      walletName={walletName ?? name ?? `My ${getCurrencyInfo(allCurrencyInfos, currencyCode)?.displayName ?? ''}`}
      gradient={gradient}
    >
      <View style={styles.balance}>
        <EdgeText>{nativeCryptoAmount}</EdgeText>
        <EdgeText style={styles.fiatBalance}>{fiatBalanceText}</EdgeText>
      </View>
    </WalletListRow>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  balance: {
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  fiatBalance: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))
