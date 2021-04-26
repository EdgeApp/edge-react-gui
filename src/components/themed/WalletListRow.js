// @flow
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import { formatNumber } from '../../locales/intl.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { calculateWalletFiatBalanceWithoutState } from '../../modules/UI/selectors.js'
import type { RootState } from '../../types/reduxTypes.js'
import { getCryptoAmount, getDenomFromIsoCode, getDenomination, getFiatSymbol, getYesterdayDateRoundDownHour } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, useTheme, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletProgressIcon } from './WalletProgressIcon.js'

type OwnProps = {
  currencyCode: string,
  icon?: string,
  isModal?: boolean,
  label?: string,
  onPress?: () => void,
  onLongPress?: () => void,
  walletId?: string,
  walletName: string
}

type StateProps = {
  cryptoAmount: string,
  differencePercentage: string,
  differencePercentageStyle: 'default' | 'positive' | 'negative',
  exchangeRate: string,
  exchangeRateFiatSymbol: string,
  fiatBalance: string,
  fiatBalanceSymbol: string,
  loading: boolean
}

type Props = OwnProps & StateProps & ThemeProps

function WalletRow(props: { isModal?: boolean, children: React.Node }) {
  const { isModal, children } = props
  const styles = getStyles(useTheme())

  if (isModal === true) {
    return <View style={styles.containerModal}>{children}</View>
  }

  return <Gradient style={styles.container}>{children}</Gradient>
}

class WalletListRowComponent extends React.PureComponent<Props> {
  renderIcon() {
    const { currencyCode, icon, walletId } = this.props
    return <WalletProgressIcon currencyCode={currencyCode} walletId={walletId} iconImage={icon} />
  }

  renderRate() {
    const { differencePercentage, differencePercentageStyle, exchangeRate, exchangeRateFiatSymbol, isModal, theme } = this.props
    const styles = getStyles(theme)
    const percentageStyle =
      differencePercentageStyle === 'positive'
        ? styles.percentagePositive
        : differencePercentageStyle === 'negative'
        ? styles.percentageNegative
        : styles.percentageNeutral

    if (!isModal) {
      return <EdgeText style={percentageStyle}>{exchangeRateFiatSymbol + exchangeRate + '  ' + differencePercentage}</EdgeText>
    }

    return null
  }

  renderRight() {
    const { cryptoAmount, fiatBalance, fiatBalanceSymbol, label, theme } = this.props
    const styles = getStyles(theme)

    if (label) {
      return (
        <View style={styles.labelContainer}>
          <EdgeText style={styles.labelText}>{label}</EdgeText>
        </View>
      )
    }

    return (
      <View>
        <EdgeText style={styles.detailsValue}>{cryptoAmount}</EdgeText>
        <EdgeText style={styles.detailsFiat}>{fiatBalanceSymbol + fiatBalance}</EdgeText>
      </View>
    )
  }

  render() {
    const { currencyCode, isModal, loading, onPress, onLongPress, walletName, theme } = this.props
    const styles = getStyles(theme)

    return (
      <WalletRow isModal={isModal}>
        <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
          {loading === true ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={theme.primaryText} size="large" />
            </View>
          ) : (
            <View style={styles.rowContainer}>
              <View style={styles.iconContainer}>{this.renderIcon()}</View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailsRow}>
                  <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
                  {this.renderRate()}
                </View>
                <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
              </View>
              {this.renderRight()}
            </View>
          )}
        </TouchableOpacity>
      </WalletRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Row Component
  container: {
    flex: 1,
    paddingHorizontal: theme.rem(1)
  },
  containerModal: {
    backgroundColor: theme.modal
  },

  // Row Containers
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    marginVertical: theme.rem(1)
  },
  loaderContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(4.25),
    paddingHorizontal: theme.rem(1.75)
  },

  // Icons
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  iconSize: {
    width: theme.rem(2),
    height: theme.rem(2)
  },

  // Details
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  detailsRow: {
    flexDirection: 'row'
  },
  detailsCurrency: {
    fontFamily: theme.fontFaceBold,
    marginRight: theme.rem(0.75)
  },
  detailsValue: {
    marginLeft: theme.rem(0.5),
    textAlign: 'right'
  },
  detailsName: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  detailsFiat: {
    fontSize: theme.rem(0.75),
    textAlign: 'right',
    color: theme.secondaryText
  },

  // Label
  labelContainer: {
    justifyContent: 'center'
  },
  labelText: {
    fontFamily: theme.fontFaceBold
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

export const WalletListRow = connect((state: RootState, ownProps: OwnProps): StateProps => {
  const { currencyCode, walletId } = ownProps
  const guiWallet = walletId ? state.ui.wallets.byId[walletId] : null

  let cryptoAmount = ''
  let differencePercentageString = ''
  let differencePercentageStyle = 'default'
  let exchangeRateString = ''
  let exchangeRateFiatSymbol = ''
  let fiatBalanceString = ''
  let fiatBalanceSymbol = ''

  if (guiWallet != null) {
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
    cryptoAmount = showBalance
      ? balance && balance !== '0'
        ? getCryptoAmount(balance, denomination, exchangeDenomination, fiatDenomination, exchangeRate, guiWallet)
        : '0'
      : ''

    // Fiat Balance
    const walletFiatSymbol = getFiatSymbol(guiWallet.isoFiatCurrencyCode)
    const fiatBalance = calculateWalletFiatBalanceWithoutState(guiWallet, currencyCode, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : '0'
    fiatBalanceSymbol = showBalance && exchangeRate ? walletFiatSymbol : ''
    fiatBalanceString = showBalance && exchangeRate ? fiatBalanceFormat : ''

    // Currency Exhange Rate
    const exchangeRateFormat = exchangeRate ? formatNumber(exchangeRate, { toFixed: exchangeRate && Math.log10(exchangeRate) >= 3 ? 0 : 2 }) : null
    exchangeRateFiatSymbol = exchangeRateFormat ? `${walletFiatSymbol} ` : ''
    exchangeRateString = exchangeRateFormat ? `${exchangeRateFormat}` : ''

    // Yesterdays Percentage Difference
    const yesterdayUsdExchangeRate = exchangeRates[`${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`]
    const fiatExchangeRate = guiWallet.isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${guiWallet.isoFiatCurrencyCode}`] : 1
    const yesterdayExchangeRate = yesterdayUsdExchangeRate * fiatExchangeRate
    const differenceYesterday = exchangeRate ? exchangeRate - yesterdayExchangeRate : null

    let differencePercentage = differenceYesterday ? (differenceYesterday / yesterdayExchangeRate) * 100 : null
    if (!yesterdayExchangeRate) {
      differencePercentage = ''
    }

    if (!exchangeRate || !differencePercentage || isNaN(differencePercentage)) {
      differencePercentageString = ''
    } else if (exchangeRate && differencePercentage && differencePercentage === 0) {
      differencePercentageString = '0.00%'
    } else if (exchangeRate && differencePercentage && differencePercentage < 0) {
      differencePercentageStyle = 'negative'
      differencePercentageString = `-${Math.abs(differencePercentage).toFixed(1)}%`
    } else if (exchangeRate && differencePercentage && differencePercentage > 0) {
      differencePercentageStyle = 'positive'
      differencePercentageString = `+${Math.abs(differencePercentage).toFixed(1)}%`
    }
  }

  return {
    cryptoAmount,
    differencePercentage: differencePercentageString,
    differencePercentageStyle,
    exchangeRate: exchangeRateString,
    exchangeRateFiatSymbol,
    fiatBalance: fiatBalanceString,
    fiatBalanceSymbol,
    loading: walletId != null && guiWallet == null
  }
})(withTheme(WalletListRowComponent))
