/* eslint-disable flowtype/require-valid-file-annotation */

import { bns } from 'biggystring'
import React, { Component } from 'react'
import { ActivityIndicator, Image, TouchableHighlight, View } from 'react-native'
import { connect } from 'react-redux'

import sort from '../../assets/images/walletlist/sort.png'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import T from '../../modules/UI/components/FormattedText/index'
import { calculateWalletFiatBalanceWithoutState } from '../../modules/UI/selectors.js'
import styles, { styles as styleRaw } from '../../styles/scenes/WalletListStyle.js'
import { decimalOrZero, getFiatSymbol, truncateDecimals } from '../../util/utils'

const DIVIDE_PRECISION = 18

class SortableWalletListRow extends Component<Props, State> {
  render () {
    let multiplier,
      name,
      symbol,
      symbolImageDarkMono,
      currencyCode,
      preliminaryCryptoAmount,
      finalCryptoAmount,
      finalCryptoAmountString,
      fiatBalance,
      fiatBalanceFormat,
      fiatBalanceSymbol,
      fiatBalanceString
    const { data, walletFiatSymbol, settings, exchangeRates, showBalance } = this.props
    const walletData = data

    if (walletData.currencyCode) {
      // if wallet is done loading
      const displayDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(this.props.settings, walletData.currencyCode)
      multiplier = displayDenomination.multiplier
      name = walletData.name || s.strings.string_no_name
      symbol = displayDenomination.symbol
      symbolImageDarkMono = walletData.symbolImageDarkMono
      currencyCode = walletData.currencyCode
      preliminaryCryptoAmount = truncateDecimals(bns.div(walletData.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
      finalCryptoAmount = intl.formatNumberInput(decimalOrZero(preliminaryCryptoAmount, 6)) // make it show zero if infinitesimal number
      finalCryptoAmountString = showBalance ? `${symbol || ''} ${finalCryptoAmount}` : ''
      fiatBalance = calculateWalletFiatBalanceWithoutState(walletData, settings, exchangeRates)
      fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : 0
      fiatBalanceSymbol = showBalance ? walletFiatSymbol : ''
      fiatBalanceString = showBalance ? fiatBalanceFormat : ''
    }

    return (
      <TouchableHighlight
        style={[styles.rowContainer, styles.sortableWalletListRow]}
        underlayColor={styleRaw.walletRowUnderlay.color}
        {...this.props.sortHandlers}
      >
        {walletData.currencyCode ? (
          <View style={[styles.rowContent]}>
            <View style={[styles.rowDragArea]}>
              <Image source={sort} style={styles.rowDragIcon} />
            </View>
            <View style={styles.rowIconWrap}>
              {symbolImageDarkMono && (
                <Image
                  style={[styles.rowDragCurrencyLogo, { marginLeft: 0, marginRight: 5 }]}
                  transform={[{ translateY: 3 }]}
                  source={{ uri: symbolImageDarkMono }}
                />
              )}
            </View>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsRow}>
                <T style={[styles.walletDetailsRowCurrency]}>{currencyCode}</T>
                <T style={[styles.walletDetailsRowValue]}>{finalCryptoAmountString}</T>
              </View>
              <View style={styles.walletDetailsRow}>
                <T style={[styles.walletDetailsRowName]}>{name}</T>
                <View style={styles.walletDetailsFiatBalanceRow}>
                  <T style={[styles.walletDetailsRowFiat]}>{fiatBalanceSymbol}</T>
                  <T style={[styles.walletDetailsRowFiat]}>{fiatBalanceString}</T>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.rowContent]}>
            <View style={[styles.rowNameTextWrap]}>
              <ActivityIndicator style={{ height: 18, width: 18 }} />
            </View>
          </View>
        )}
      </TouchableHighlight>
    )
  }
}

export default connect((state, ownProps) => {
  const settings = state.ui.settings
  const exchangeRates = state.exchangeRates

  const data = ownProps.data || null
  const walletFiatSymbol = data ? getFiatSymbol(data.isoFiatCurrencyCode) : ''

  return {
    showBalance: typeof ownProps.showBalance === 'function' ? ownProps.showBalance(state) : ownProps.showBalance,
    settings,
    exchangeRates,
    walletFiatSymbol
  }
})(SortableWalletListRow)
