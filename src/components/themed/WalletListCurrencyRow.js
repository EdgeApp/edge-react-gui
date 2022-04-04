// @flow

import { abs, div, gt, mul, sub } from 'biggystring'
import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { formatNumber } from '../../locales/intl.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { calculateFiatBalance } from '../../selectors/WalletSelectors.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import type { RootState } from '../../types/reduxTypes.js'
import { type GuiExchangeRates } from '../../types/types.js'
import { getCryptoAmount, getDenomFromIsoCode, getFiatSymbol, getYesterdayDateRoundDownHour, zeroString } from '../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CardContent } from './CardContent'
import { ClickableRow } from './ClickableRow'
import { EdgeText } from './EdgeText.js'
import { WalletProgressIcon } from './WalletProgressIcon.js'

type Props = {
  currencyCode: string,
  gradient?: boolean,
  onPress?: () => void,
  onLongPress?: () => void,
  showRate?: boolean,
  paddingRem?: number | number[],
  walletId: string,
  // eslint-disable-next-line react/no-unused-prop-types
  walletName?: string
}

type GetRatesParams = {
  currencyCode: string,
  exchangeRate?: string,
  exchangeRates: GuiExchangeRates,
  fiatExchangeRate: string,
  walletFiatSymbol: string
}

type CalculateValuesResult = {
  exchangeRate?: string,
  fiatExchangeRate: string,
  walletFiatSymbol: string,
  cryptoAmount: string,
  fiatBalanceSymbol: string,
  fiatBalanceString: string
}

export const getRate = (getRateParams: GetRatesParams) => {
  const { currencyCode, exchangeRate, exchangeRates, fiatExchangeRate = '0', walletFiatSymbol } = getRateParams
  // Create the default empty result function
  const emptyResult = (...args) => ({
    exchangeRateFiatSymbol: args[0] ?? '',
    exchangeRateString: args[1] ?? '',
    differencePercentageString: args[2] ? `${args[2]}%` : '',
    differencePercentageStyle: args[3] ?? 'Neutral'
  })
  // If the `exchangeRate` is missing, return the default empty result
  if (exchangeRate == null) return emptyResult()
  // Today's Currency Exchange Rate
  const todayExchangeRate = exchangeRate
  const exchangeRateDecimals = Math.log10(parseFloat(todayExchangeRate)) >= 3 ? 0 : 2
  const exchangeRateString = formatNumber(exchangeRate, { toFixed: exchangeRateDecimals })
  // Create the default zero change Exchange Rate result function
  const result = (...args) => emptyResult(`${walletFiatSymbol} `, exchangeRateString, ...args)
  // Yesterdays Exchange Rate
  const currencyPair = `${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`
  const yesterdayUsdExchangeRate = exchangeRates[currencyPair] ?? '0'
  const yesterdayExchangeRate = mul(yesterdayUsdExchangeRate, fiatExchangeRate)
  // Return the Exchange Rate without `percentageString` in case we are missing yesterday's rate
  if (zeroString(yesterdayExchangeRate)) return result()
  // Calculate the percentage difference in rate between yesterday and today
  const differenceYesterday = sub(todayExchangeRate, yesterdayExchangeRate)
  const differencePercentage = mul(div(differenceYesterday, yesterdayExchangeRate, 3), '100')
  // Return zero result
  if (zeroString(differencePercentage)) return result('0.00')
  // If not zero, create the `percentageString`
  const percentageString = abs(differencePercentage)
  // Return Positive result if greater then zero
  if (gt(differencePercentage, '0')) return result(`+${percentageString}`, 'Positive')
  // If it's not zero or positive, it must be a Negative result
  return result(`-${percentageString}`, 'Negative')
}

const noOnPress = () => {}

export const WalletListCurrencyRow = (props: Props) => {
  const { currencyCode, walletId } = props
  const renderIcon = () => {
    return <WalletProgressIcon currencyCode={currencyCode} walletId={walletId} />
  }
  const state = useSelector(state => state)
  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)

  const [edgeWallets, setEdgeWallets] = useState(account.currencyWallets)
  const [edgeWallet, setEdgeWallet] = useState(edgeWallets[walletId])

  useEffect(
    () =>
      account.watch('currencyWallets', wallets => {
        setEdgeWallets(wallets)
        setEdgeWallet(wallets[walletId])
      }),
    [account]
  )

  const [walletName, setWalletName] = useState(edgeWallet?.name ?? '')
  useEffect(() => (edgeWallet != null ? edgeWallet.watch('name', setWalletName) : () => {}), [edgeWallet])

  const [balances, setBalances] = useState(edgeWallet?.balances ?? {})
  useEffect(() => (edgeWallet != null ? edgeWallet.watch('balances', setBalances) : () => {}), [edgeWallet])

  const walletNameString = props.walletName ?? walletName ?? ''
  const { exchangeRate, fiatExchangeRate, walletFiatSymbol, cryptoAmount, fiatBalanceSymbol, fiatBalanceString } = calculateValues(
    state,
    props,
    account,
    exchangeRates,
    balances,
    showBalance
  )

  const renderChildren = (theme: Theme) => {
    const { showRate = false } = props
    const styles = getStyles(theme)

    const exchangeData = {
      exchangeRateString: '',
      exchangeRateType: 'Neutral'
    }

    if (showRate) {
      const { differencePercentageStyle, differencePercentageString, exchangeRateFiatSymbol, exchangeRateString } = getRate({
        currencyCode,
        exchangeRate,
        exchangeRates,
        fiatExchangeRate,
        walletFiatSymbol
      })
      exchangeData.exchangeRateString = `${exchangeRateFiatSymbol}${exchangeRateString} ${differencePercentageString}`
      exchangeData.exchangeRateType = differencePercentageStyle
    }

    return (
      <CardContent
        image={renderIcon()}
        title={
          <>
            <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
            <EdgeText style={[styles.detailsExchange, styles[`percentage${exchangeData.exchangeRateType}`]]}>{exchangeData.exchangeRateString}</EdgeText>
          </>
        }
        value={<EdgeText style={styles.detailsValue}>{cryptoAmount}</EdgeText>}
        subTitle={walletNameString}
        subValue={fiatBalanceSymbol + fiatBalanceString}
      />
    )
  }

  const { onPress, onLongPress, paddingRem, gradient } = props
  const theme = useTheme()

  return (
    <ClickableRow onPress={onPress || noOnPress} onLongPress={onLongPress} gradient={gradient} paddingRem={paddingRem} highlight>
      {renderChildren(theme)}
    </ClickableRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  detailsValue: {
    marginLeft: theme.rem(0.5),
    textAlign: 'right'
  },
  detailsFiat: {
    fontSize: theme.rem(0.75),
    textAlign: 'right',
    color: theme.secondaryText
  },
  detailsCurrency: {
    fontFamily: theme.fontFaceMedium,
    marginRight: theme.rem(0.75),
    flexShrink: 1
  },
  detailsExchange: {
    flexShrink: 2
  },

  // Difference Percentage Styles
  percentageNeutral: {
    color: theme.secondaryText
  },
  percentagePositive: {
    color: theme.positiveText
  },
  percentageNegative: {
    color: theme.negativeText
  }
}))

const calculateValues = (
  state: RootState,
  props: Props,
  account: EdgeAccount,
  exchangeRates: GuiExchangeRates,
  balances: { [currencyCode: string]: string },
  showBalance: boolean
): CalculateValuesResult => {
  const { currencyCode, walletId } = props
  const wallet = account.currencyWallets[walletId]

  if (wallet == null) {
    return {
      cryptoAmount: '0',
      fiatBalanceSymbol: '$',
      fiatBalanceString: '0',
      walletNameString: '',

      // Exchange rate with style
      exchangeRate: undefined,
      fiatExchangeRate: '1',
      walletFiatSymbol: '$'
    }
  }

  // Crypto Amount And Exchange Rate
  const balance = balances[currencyCode] ?? '0'
  const denomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, currencyCode)
  const exchangeDenomination = getExchangeDenomination(state, wallet.currencyInfo.pluginId, currencyCode)
  const fiatDenomination = getDenomFromIsoCode(wallet.fiatCurrencyCode.replace('iso:', ''))
  const rateKey = `${currencyCode}_${wallet.fiatCurrencyCode}`
  const exchangeRate = !zeroString(exchangeRates[rateKey]) ? exchangeRates[rateKey] : undefined
  const cryptoAmount = showBalance
    ? !zeroString(balance)
      ? getCryptoAmount(balance, denomination, exchangeDenomination, fiatDenomination, exchangeRate, wallet.currencyInfo.currencyCode)
      : '0'
    : ''

  // Fiat Balance
  const walletFiatSymbol = getFiatSymbol(wallet.fiatCurrencyCode)
  const fiatBalance = calculateFiatBalance(wallet, exchangeDenomination, exchangeRates)
  const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : '0'
  const fiatBalanceSymbol = showBalance && exchangeRate ? walletFiatSymbol : ''
  const fiatBalanceString = showBalance && exchangeRate ? fiatBalanceFormat : ''

  const fiatExchangeRate = wallet.fiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${wallet.fiatCurrencyCode}`] : '1'

  return {
    // Render Children
    cryptoAmount,
    fiatBalanceSymbol,
    fiatBalanceString,

    // Exchange rate with style
    exchangeRate,
    fiatExchangeRate,
    walletFiatSymbol
  }
}
