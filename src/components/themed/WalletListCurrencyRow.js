// @flow
import { abs, div, gt, log10, mul, sub, toFixed } from 'biggystring'
import { useCavy } from 'cavy'
import { type EdgeCurrencyWallet, type EdgeDenomination, type EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useFiatText } from '../../hooks/useFiatText.js'
import { useWalletName } from '../../hooks/useWalletName.js'
import { useWatchWallet } from '../../hooks/useWatch.js'
import { formatNumber, truncateDecimals } from '../../locales/intl.js'
import { getDisplayDenominationFromState, getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
import { memo, useMemo } from '../../types/reactHooks.js'
import { TouchableOpacity } from '../../types/reactNative.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type GuiExchangeRates } from '../../types/types.js'
import {
  DECIMAL_PRECISION,
  decimalOrZero,
  DEFAULT_TRUNCATE_PRECISION,
  fixFiatCurrencyCode,
  getDenomFromIsoCode,
  getYesterdayDateRoundDownHour,
  maxPrimaryCurrencyConversionDecimals,
  precisionAdjust,
  truncateDecimals as nonLocalTruncateDecimals,
  zeroString
} from '../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from './CurrencyIcon.js'
import { EdgeText } from './EdgeText.js'

type Props = {|
  showRate?: boolean,
  token?: EdgeToken,
  tokenId?: string,
  wallet: EdgeCurrencyWallet,

  // Callbacks:
  onLongPress?: () => void,
  onPress?: (walletId: string, currencyCode: string) => void
|}

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
  const { multiplier, symbol } = denomination
  if (zeroString(balance)) return `${symbol ? symbol + ' ' : ''}0`
  let maxConversionDecimals = DEFAULT_TRUNCATE_PRECISION

  if (exchangeRate) {
    const precisionAdjustValue = precisionAdjust({
      primaryExchangeMultiplier: exchangeDenomination.multiplier,
      secondaryExchangeMultiplier: fiatDenomination.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRate
    })
    maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(log10(multiplier), precisionAdjustValue)
  }

  try {
    const preliminaryCryptoAmount = nonLocalTruncateDecimals(div(balance, multiplier, DECIMAL_PRECISION), maxConversionDecimals)
    const finalCryptoAmount = formatNumber(decimalOrZero(preliminaryCryptoAmount, maxConversionDecimals)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    return `${symbol != null ? symbol + ' ' : ''}${finalCryptoAmount}`
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
  const result = (value, style = 'neutral') => ({
    differencePercentageString: value != null ? `${value}%` : '',
    differencePercentageStyle: style
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

export const WalletListCurrencyRowComponent = (props: Props) => {
  const {
    showRate = false,
    token,
    tokenId,
    wallet,

    // Callbacks:
    onLongPress,
    onPress
  } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)
  const generateTestHook = useCavy()

  const { currencyCode } = token == null ? wallet.currencyInfo : token
  const exchangeRates = useSelector(state => state.exchangeRates)
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const balances = useWatchWallet(wallet, 'balances')
  const fiatCurrencyCode = useWatchWallet(wallet, 'fiatCurrencyCode')
  const name = useWalletName(wallet)

  // Crypto Amount And Exchange Rate
  const { currencyInfo } = wallet
  const balance = balances[currencyCode] ?? '0'
  const denomination = dispatch(getDisplayDenominationFromState(currencyInfo.pluginId, currencyCode))
  const exchangeDenomination = dispatch(getExchangeDenominationFromState(currencyInfo.pluginId, currencyCode))
  const fiatDenomination = getDenomFromIsoCode(fiatCurrencyCode)
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)
  const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
  const exchangeRate = !zeroString(exchangeRates[rateKey]) ? exchangeRates[rateKey] : '1'
  const cryptoExchangeMultiplier = exchangeDenomination.multiplier

  const nativeCryptoAmount = getCryptoAmount({ balance, exchangeRate, exchangeDenomination, fiatDenomination, denomination, currencyCode })

  const { fiatText: fiatBalanceText } = useFiatText({
    nativeCryptoAmount: balance,
    cryptoCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    cryptoExchangeMultiplier
  })

  let { fiatText: exchangeRateText } = useFiatText({
    nativeCryptoAmount: cryptoExchangeMultiplier,
    cryptoCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    autoPrecision: true,
    cryptoExchangeMultiplier
  })
  // No need for decimals if over '1000' of what ever fiat currency
  if (Math.log10(parseFloat(exchangeRate)) >= 3) exchangeRateText = truncateDecimals(exchangeRateText, 0)

  let exchangeRateType = 'neutral'

  if (showRate) {
    const { differencePercentageString, differencePercentageStyle } = getDifference({
      exchangeRate,
      currencyCode,
      exchangeRates,
      fiatExchangeRate: isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${isoFiatCurrencyCode}`] : '1'
    })
    exchangeRateText += ` ${differencePercentageString}`
    exchangeRateType = differencePercentageStyle
  }

  const handlePress = useMemo(() => (onPress != null ? () => onPress(wallet.id, currencyCode) : () => {}), [currencyCode, onPress, wallet])

  return (
    <TouchableOpacity style={styles.row} onLongPress={onLongPress} onPress={handlePress} ref={generateTestHook(wallet.id)}>
      <CurrencyIcon marginRem={1} sizeRem={2} tokenId={tokenId} walletId={wallet.id} />
      <View style={styles.nameColumn}>
        <View style={styles.currencyRow}>
          <EdgeText style={styles.currencyText}>{currencyCode}</EdgeText>
          {showRate ? <EdgeText style={[styles.exchangeRateText, styles[exchangeRateType ?? 'neutral']]}>{exchangeRateText}</EdgeText> : null}
        </View>
        <EdgeText style={styles.nameText}>{name}</EdgeText>
      </View>
      {showBalance ? (
        <View style={styles.balanceColumn}>
          <EdgeText>{nativeCryptoAmount}</EdgeText>
          <EdgeText style={styles.fiatBalanceText}>{fiatBalanceText}</EdgeText>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Layout:
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  },
  balanceColumn: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    paddingRight: theme.rem(1)
  },
  nameColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },

  // Text:
  fiatBalanceText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  currencyText: {
    flexBasis: 'auto',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium
  },
  exchangeRateText: {
    textAlign: 'left',
    flexBasis: 'auto',
    flexShrink: 1,
    marginLeft: theme.rem(0.75)
  },
  nameText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },

  // Difference Percentage Styles
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

export const WalletListCurrencyRow = memo(WalletListCurrencyRowComponent)
