// @flow

import { abs, div, gt, mul, sub } from 'biggystring'
import type { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'

import { formatNumber } from '../../locales/intl.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { calculateFiatBalance } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type GuiExchangeRates, asSafeDefaultGuiWallet } from '../../types/types.js'
import { getCryptoAmount, getCurrencyInfo, getDenomFromIsoCode, getFiatSymbol, getYesterdayDateRoundDownHour, zeroString } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { CardContent } from './CardContent'
import { ClickableRow } from './ClickableRow'
import { EdgeText } from './EdgeText.js'
import { WalletProgressIcon } from './WalletProgressIcon.js'

type OwnProps = {
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

type StateProps = {
  cryptoAmount: string,
  fiatBalanceSymbol: string,
  fiatBalanceString: string,
  walletNameString: string,
  exchangeRate?: string,
  exchangeRates: GuiExchangeRates,
  fiatExchangeRate: string,
  walletFiatSymbol: string
}

type Props = OwnProps & StateProps & ThemeProps

type GetRatesParams = {
  currencyCode: string,
  exchangeRate?: string,
  exchangeRates: GuiExchangeRates,
  fiatExchangeRate: string,
  walletFiatSymbol: string
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

class WalletListRowComponent extends React.PureComponent<Props> {
  noOnPress = () => {}
  renderIcon() {
    return <WalletProgressIcon currencyCode={this.props.currencyCode} walletId={this.props.walletId} />
  }

  getRate() {
    const { currencyCode, exchangeRate, exchangeRates, fiatExchangeRate, walletFiatSymbol } = this.props
    return getRate({ currencyCode, exchangeRate, exchangeRates, fiatExchangeRate, walletFiatSymbol })
  }

  renderChildren() {
    const { cryptoAmount, fiatBalanceString, fiatBalanceSymbol, walletNameString, currencyCode, showRate = false, theme } = this.props
    const styles = getStyles(theme)

    const exchangeData = {
      exchangeRateString: '',
      exchangeRateType: 'Neutral'
    }
    if (showRate) {
      const { differencePercentageStyle, differencePercentageString, exchangeRateFiatSymbol, exchangeRateString } = this.getRate()
      exchangeData.exchangeRateString = `${exchangeRateFiatSymbol}${exchangeRateString} ${differencePercentageString}`
      exchangeData.exchangeRateType = differencePercentageStyle
    }

    return (
      <CardContent
        image={this.renderIcon()}
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

  render() {
    const { onPress, onLongPress, paddingRem, gradient } = this.props
    return (
      <ClickableRow onPress={onPress || this.noOnPress} onLongPress={onLongPress} gradient={gradient} paddingRem={paddingRem} highlight>
        {this.renderChildren()}
      </ClickableRow>
    )
  }
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

export const WalletListCurrencyRow = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { currencyCode, walletName, walletId } = ownProps
    const wallet = state.core.account.currencyWallets[walletId]
    const guiWallet = asSafeDefaultGuiWallet(state.ui.wallets.byId[walletId])

    const exchangeRates = state.exchangeRates
    const showBalance = state.ui.settings.isAccountBalanceVisible
    const isToken = guiWallet.currencyCode !== currencyCode

    // Crypto Amount And Exchange Rate
    const balance = isToken ? guiWallet.nativeBalances[currencyCode] : guiWallet.primaryNativeBalance
    const denomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, currencyCode)
    const exchangeDenomination = getExchangeDenomination(state, wallet.currencyInfo.pluginId, currencyCode)
    const fiatDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
    const rateKey = `${currencyCode}_${guiWallet.isoFiatCurrencyCode}`
    const exchangeRate = !zeroString(exchangeRates[rateKey]) ? exchangeRates[rateKey] : undefined
    const cryptoAmount = showBalance
      ? !zeroString(balance)
        ? getCryptoAmount(balance, denomination, exchangeDenomination, fiatDenomination, exchangeRate, guiWallet)
        : '0'
      : ''

    // Fiat Balance
    const walletFiatSymbol = getFiatSymbol(guiWallet.isoFiatCurrencyCode)
    const fiatBalance = calculateFiatBalance(wallet, exchangeDenomination, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : '0'
    const fiatBalanceSymbol = showBalance && exchangeRate ? walletFiatSymbol : ''
    const fiatBalanceString = showBalance && exchangeRate ? fiatBalanceFormat : ''

    const fiatExchangeRate = guiWallet.isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${guiWallet.isoFiatCurrencyCode}`] : '1'

    let walletNameString = walletName
    if (walletNameString == null) {
      if (guiWallet != null) {
        walletNameString = guiWallet.name
      } else {
        const { allCurrencyInfos } = state.ui.settings.plugins
        const currencyInfo: EdgeCurrencyInfo | void = getCurrencyInfo(allCurrencyInfos, currencyCode)
        walletNameString = `My ${currencyInfo?.displayName ?? ''}`
      }
    }

    return {
      // Render Children
      cryptoAmount,
      fiatBalanceSymbol,
      fiatBalanceString,
      walletNameString,

      // Exchange rate with style
      exchangeRate,
      exchangeRates,
      fiatExchangeRate,
      walletFiatSymbol
    }
  },
  dispatch => ({})
)(withTheme(WalletListRowComponent))
