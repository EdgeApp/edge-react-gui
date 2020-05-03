// @flow

import { bns } from 'biggystring'
import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import { connect } from 'react-redux'

import sort from '../../assets/images/walletlist/sort.png'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import { type ExchangeRatesState } from '../../modules/ExchangeRates/reducer.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import T from '../../modules/UI/components/FormattedText/index'
import { calculateWalletFiatBalanceWithoutState } from '../../modules/UI/selectors.js'
import { type SettingsState } from '../../reducers/scenes/SettingsReducer.js'
import styles, { styles as styleRaw } from '../../styles/scenes/WalletListStyle.js'
import { type State as ReduxState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { decimalOrZero, getFiatSymbol, truncateDecimals } from '../../util/utils'

const DIVIDE_PRECISION = 18

type OwnProps = {
  guiWallet: GuiWallet,
  showBalance: boolean | ((state: ReduxState) => boolean)
}
type StateProps = {
  exchangeRates: ExchangeRatesState,
  showBalance: boolean,
  settings: SettingsState,
  walletFiatSymbol: string | void
}
type Props = OwnProps & StateProps

class WalletListSortableRowComponent extends Component<Props> {
  render () {
    const { guiWallet, walletFiatSymbol, settings, exchangeRates, showBalance } = this.props
    // $FlowFixMe react-native-sortable-listview sneakily injects this prop:
    const { sortHandlers } = this.props

    const displayDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(this.props.settings, guiWallet.currencyCode)
    const multiplier = displayDenomination.multiplier
    const name = guiWallet.name || s.strings.string_no_name
    const symbol = displayDenomination.symbol
    const symbolImageDarkMono = guiWallet.symbolImageDarkMono
    const currencyCode = guiWallet.currencyCode
    const preliminaryCryptoAmount = truncateDecimals(bns.div(guiWallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const finalCryptoAmount = intl.formatNumberInput(decimalOrZero(preliminaryCryptoAmount, 6)) // make it show zero if infinitesimal number
    const finalCryptoAmountString = showBalance ? `${symbol || ''} ${finalCryptoAmount}` : ''
    const fiatBalance = calculateWalletFiatBalanceWithoutState(guiWallet, currencyCode, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : 0
    const fiatBalanceSymbol = showBalance ? walletFiatSymbol : ''
    const fiatBalanceString = showBalance ? fiatBalanceFormat : ''

    return (
      <TouchableHighlight style={[styles.rowContainer, styles.sortableWalletListRow]} underlayColor={styleRaw.walletRowUnderlay.color} {...sortHandlers}>
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
      </TouchableHighlight>
    )
  }
}

export const WalletListSortableRow = connect(
  (state: ReduxState, ownProps: OwnProps): StateProps => ({
    showBalance: typeof ownProps.showBalance === 'function' ? ownProps.showBalance(state) : ownProps.showBalance,
    settings: state.ui.settings,
    exchangeRates: state.exchangeRates,
    walletFiatSymbol: getFiatSymbol(ownProps.guiWallet.isoFiatCurrencyCode)
  })
)(WalletListSortableRowComponent)
