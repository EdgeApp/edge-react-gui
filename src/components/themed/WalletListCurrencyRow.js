// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'

import { formatNumber } from '../../locales/intl.js'
import { calculateWalletFiatBalanceWithoutState } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type GuiExchangeRates } from '../../types/types.js'
import { getCryptoAmount, getCurrencyInfo, getDenomFromIsoCode, getDenomination, getFiatSymbol, getYesterdayDateRoundDownHour } from '../../util/utils'
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
  exchangeRate?: number,
  exchangeRates: GuiExchangeRates,
  fiatExchangeRate: number,
  walletFiatSymbol: string
}

type Props = OwnProps & StateProps & ThemeProps

class WalletListRowComponent extends React.PureComponent<Props> {
  noOnPress = () => {}
  renderIcon() {
    return <WalletProgressIcon currencyCode={this.props.currencyCode} walletId={this.props.walletId} />
  }

  getRate() {
    const { currencyCode, exchangeRate, exchangeRates, fiatExchangeRate, walletFiatSymbol } = this.props
    // Currency Exhange Rate
    const exchangeRateFormat = exchangeRate ? formatNumber(exchangeRate, { toFixed: exchangeRate && Math.log10(exchangeRate) >= 3 ? 0 : 2 }) : null
    const exchangeRateFiatSymbol = exchangeRateFormat ? `${walletFiatSymbol} ` : ''
    const exchangeRateString = exchangeRateFormat ? `${exchangeRateFormat}` : ''

    // Yesterdays Percentage Difference
    const yesterdayUsdExchangeRate = exchangeRates[`${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`]
    const yesterdayExchangeRate =
      yesterdayUsdExchangeRate != null && fiatExchangeRate != null ? bns.mul(yesterdayUsdExchangeRate.toFixed(18), fiatExchangeRate.toFixed(18)) : '0'

    const differenceYesterday = exchangeRate ? bns.sub(exchangeRate.toFixed(18), yesterdayExchangeRate) : null

    const differencePercentage =
      differenceYesterday != null && yesterdayExchangeRate !== '0' ? bns.mul(bns.div(differenceYesterday, yesterdayExchangeRate, 4), '100') : null

    let differencePercentageString = ''
    let differencePercentageStyle = 'Neutral'

    if (!exchangeRate || !differencePercentage || isNaN(differencePercentage)) {
      differencePercentageString = ''
    } else if (exchangeRate && differencePercentage && differencePercentage === '0') {
      differencePercentageString = '0.00%'
    } else if (exchangeRate && differencePercentage && bns.lt(differencePercentage, '0')) {
      differencePercentageStyle = 'Negative'
      differencePercentageString = `-${bns.toFixed(bns.abs(differencePercentage), 1, 1)}%`
    } else if (exchangeRate && differencePercentage && bns.gt(differencePercentage, '0')) {
      differencePercentageStyle = 'Positive'
      differencePercentageString = `+${bns.toFixed(bns.abs(differencePercentage), 1, 1)}%`
    }

    return {
      differencePercentageStyle,
      differencePercentageString,
      exchangeRateFiatSymbol,
      exchangeRateString
    }
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
    const guiWallet = state.ui.wallets.byId[walletId]

    const exchangeRates = state.exchangeRates
    const showBalance = state.ui.settings.isAccountBalanceVisible
    const settings = state.ui.settings
    const isToken = guiWallet.currencyCode !== currencyCode

    // Crypto Amount And Exchange Rate
    const balance = isToken ? guiWallet.nativeBalances[currencyCode] : guiWallet.primaryNativeBalance
    const denomination = getDenomination(currencyCode, settings, 'display')
    const exchangeDenomination = getDenomination(currencyCode, settings, 'exchange')
    const fiatDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
    const rateKey = `${currencyCode}_${guiWallet.isoFiatCurrencyCode}`
    const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : undefined
    const cryptoAmount = showBalance
      ? balance && balance !== '0'
        ? getCryptoAmount(balance, denomination, exchangeDenomination, fiatDenomination, exchangeRate, guiWallet)
        : '0'
      : ''

    // Fiat Balance
    const walletFiatSymbol = getFiatSymbol(guiWallet.isoFiatCurrencyCode)
    const fiatBalance = calculateWalletFiatBalanceWithoutState(guiWallet, currencyCode, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : '0'
    const fiatBalanceSymbol = showBalance && exchangeRate ? walletFiatSymbol : ''
    const fiatBalanceString = showBalance && exchangeRate ? fiatBalanceFormat : ''

    const fiatExchangeRate = guiWallet.isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${guiWallet.isoFiatCurrencyCode}`] : 1

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
