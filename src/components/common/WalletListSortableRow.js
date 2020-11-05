// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { ActivityIndicator, Image, TouchableHighlight, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { formatNumberInput } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { type ExchangeRatesState } from '../../modules/ExchangeRates/reducer.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import { calculateWalletFiatBalanceWithoutState } from '../../modules/UI/selectors.js'
import { type SettingsState } from '../../reducers/scenes/SettingsReducer.js'
import { type RootState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { decimalOrZero, getFiatSymbol, truncateDecimals } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

const DIVIDE_PRECISION = 18

type OwnProps = {
  guiWallet?: GuiWallet,
  showBalance: boolean | ((state: RootState) => boolean)
}

type StateProps = {
  exchangeRates: ExchangeRatesState,
  showBalance: boolean,
  settings: SettingsState,
  walletFiatSymbol: string | null
}

type Props = OwnProps & StateProps & ThemeProps

class WalletListSortableRowComponent extends React.PureComponent<Props> {
  render() {
    const { guiWallet, walletFiatSymbol, settings, exchangeRates, showBalance, theme } = this.props
    // $FlowFixMe react-native-sortable-listview sneakily injects this prop:
    const { sortHandlers } = this.props
    const styles = getStyles(theme)

    if (!guiWallet) {
      return (
        <View style={styles.container}>
          <TouchableHighlight activeOpacity={0.95} underlayColor={theme.underlayColor} {...sortHandlers}>
            <View style={[styles.rowContainer, styles.loaderContainer]}>
              <ActivityIndicator color={theme.primaryText} size="small" />
            </View>
          </TouchableHighlight>
        </View>
      )
    }

    const displayDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(this.props.settings, guiWallet.currencyCode)
    const multiplier = displayDenomination.multiplier
    const name = guiWallet.name || s.strings.string_no_name
    const symbol = displayDenomination.symbol
    const symbolImageDarkMono = guiWallet.symbolImageDarkMono
    const currencyCode = guiWallet.currencyCode
    const preliminaryCryptoAmount = truncateDecimals(bns.div(guiWallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const finalCryptoAmount = formatNumberInput(decimalOrZero(preliminaryCryptoAmount, 6)) // make it show zero if infinitesimal number
    const finalCryptoAmountString = showBalance ? `${symbol || ''} ${finalCryptoAmount}` : ''
    const fiatBalance = calculateWalletFiatBalanceWithoutState(guiWallet, currencyCode, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : 0
    const fiatBalanceSymbol = showBalance && walletFiatSymbol ? walletFiatSymbol : ''
    const fiatBalanceString = showBalance ? fiatBalanceFormat : ''

    return (
      <View style={styles.container}>
        <TouchableHighlight activeOpacity={theme.underlayOpacity} underlayColor={theme.underlayColor} {...sortHandlers}>
          <View style={styles.rowContainer}>
            <View style={styles.iconContainer}>
              <Ionicon name="ios-menu" size={theme.rem(1.25)} color={theme.icon} />
            </View>
            <View style={styles.iconContainer}>
              {symbolImageDarkMono && <Image style={styles.icon} source={{ uri: symbolImageDarkMono }} resizeMode="cover" />}
            </View>
            <View style={styles.detailsContainer}>
              <View style={styles.detailsRow}>
                <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
                <EdgeText style={styles.detailsValue}>{finalCryptoAmountString}</EdgeText>
              </View>
              <View style={styles.detailsRow}>
                <EdgeText style={styles.detailsName}>{name}</EdgeText>
                <EdgeText style={styles.detailsFiat}>{fiatBalanceSymbol + fiatBalanceString}</EdgeText>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    marginBottom: theme.rem(1 / 16)
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    height: theme.rem(4),
    padding: theme.rem(0.75),
    backgroundColor: theme.tileBackground
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(1.25),
    marginRight: theme.rem(0.75)
  },
  icon: {
    width: theme.rem(1.25),
    height: theme.rem(1.25),
    resizeMode: 'contain'
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  detailsCurrency: {
    flex: 1
  },
  detailsValue: {
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
  exchangeRate: {
    flex: 1,
    fontSize: theme.rem(0.75),
    textAlign: 'left'
  },
  percentage: {
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold
  },
  divider: {
    height: theme.rem(1 / 16),
    borderColor: theme.lineDivider,
    borderBottomWidth: theme.rem(1 / 16),
    marginVertical: theme.rem(0.5)
  }
}))

export const WalletListSortableRow = connect((state: RootState, ownProps: OwnProps): StateProps => ({
  showBalance: typeof ownProps.showBalance === 'function' ? ownProps.showBalance(state) : ownProps.showBalance,
  settings: state.ui.settings,
  exchangeRates: state.exchangeRates,
  walletFiatSymbol: ownProps.guiWallet ? getFiatSymbol(ownProps.guiWallet.isoFiatCurrencyCode) : null
}))(withTheme(WalletListSortableRowComponent))
