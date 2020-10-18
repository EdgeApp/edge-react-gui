// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { Image, StyleSheet, TouchableHighlight, View } from 'react-native'
import { connect } from 'react-redux'

import sort from '../../assets/images/walletlist/sort.png'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { type ExchangeRatesState } from '../../modules/ExchangeRates/reducer.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { calculateWalletFiatBalanceWithoutState } from '../../modules/UI/selectors.js'
import { type SettingsState } from '../../reducers/scenes/SettingsReducer.js'
import { THEME } from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'
import { type RootState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { decimalOrZero, getFiatSymbol, truncateDecimals } from '../../util/utils'

const DIVIDE_PRECISION = 18

type OwnProps = {
  guiWallet: GuiWallet,
  showBalance: boolean | ((state: RootState) => boolean)
}
type StateProps = {
  exchangeRates: ExchangeRatesState,
  showBalance: boolean,
  settings: SettingsState,
  walletFiatSymbol: string | void
}
type Props = OwnProps & StateProps

class WalletListSortableRowComponent extends React.Component<Props> {
  render() {
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
      <TouchableHighlight style={[styles.rowContainer, styles.sortableWalletListRow]} underlayColor={THEME.COLORS.ROW_PRESSED} {...sortHandlers}>
        <View style={styles.rowContent}>
          <View style={styles.rowDragArea}>
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
              <T style={styles.walletDetailsRowCurrency}>{currencyCode}</T>
              <T style={styles.walletDetailsRowValue}>{finalCryptoAmountString}</T>
            </View>
            <View style={styles.walletDetailsRow}>
              <T style={styles.walletDetailsRowName}>{name}</T>
              <View style={styles.walletDetailsFiatBalanceRow}>
                <T style={styles.walletDetailsRowFiat}>{fiatBalanceSymbol}</T>
                <T style={styles.walletDetailsRowFiat}>{fiatBalanceString}</T>
              </View>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

const rawStyles = {
  sortableWalletListRow: {
    width: PLATFORM.deviceWidth,
    height: scale(60),
    backgroundColor: THEME.COLORS.WHITE,
    paddingVertical: scale(6),
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
    borderBottomWidth: scale(1),
    borderColor: THEME.COLORS.WHITE
  },
  rowContainer: {
    padding: scale(6),
    paddingLeft: scale(8),
    height: scale(106),
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row'
  },
  rowIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scale(36)
  },
  rowDragArea: {
    justifyContent: 'center',
    marginRight: scale(10),
    marginLeft: scale(4)
  },
  rowDragCurrencyLogo: {
    height: scale(22),
    width: scale(22),
    marginRight: scale(5),
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  rowDragIcon: {
    top: scale(2),
    height: scale(15),
    width: scale(15)
  },
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },
  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'column',
    marginTop: scale(5)
  },
  walletDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletDetailsRowCurrency: {
    flex: 1,
    fontSize: scale(18)
  },
  walletDetailsRowValue: {
    textAlign: 'right',
    fontSize: scale(18),
    color: THEME.COLORS.GRAY_1
  },
  walletDetailsRowName: {
    flex: 1,
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsRowFiat: {
    fontSize: scale(14),
    textAlign: 'right',
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsFiatBalanceRow: {
    flexDirection: 'row'
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const WalletListSortableRow = connect((state: RootState, ownProps: OwnProps): StateProps => ({
  showBalance: typeof ownProps.showBalance === 'function' ? ownProps.showBalance(state) : ownProps.showBalance,
  settings: state.ui.settings,
  exchangeRates: state.exchangeRates,
  walletFiatSymbol: getFiatSymbol(ownProps.guiWallet.isoFiatCurrencyCode)
}))(WalletListSortableRowComponent)
