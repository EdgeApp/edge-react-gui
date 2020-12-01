// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import credLogo from '../../assets/images/cred_logo.png'
import { Fontello } from '../../assets/vector/index.js'
import * as Constants from '../../constants/indexConstants.js'
import { guiPlugins } from '../../constants/plugins/GuiPlugins.js'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { convertCurrency, getSelectedWalletLoadingPercent } from '../../modules/UI/selectors.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { scale } from '../../util/scaling.js'
import { convertNativeToDenomination, decimalOrZero, getDefaultDenomination, getDenomination, getFiatSymbol } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WiredProgressBar } from './WiredProgressBar.js'

export type StateProps = {
  cryptoAmount: string,
  currencyDenominationSymbol: string,
  currencyCode: string,
  currencyName: string,
  fiatCurrencyCode: string,
  fiatBalance: number,
  fiatSymbol: string,
  walletName: string,
  isAccountBalanceVisible: boolean,
  transactionsLength: number
}

export type DispatchProps = {
  toggleBalanceVisibility: () => void
}

type Props = StateProps & DispatchProps & ThemeProps

class TransactionListTopComponent extends React.Component<Props> {
  renderBalanceBox = () => {
    const {
      cryptoAmount,
      currencyCode,
      currencyDenominationSymbol,
      fiatSymbol,
      fiatBalance,
      fiatCurrencyCode,
      walletName,
      isAccountBalanceVisible,
      theme
    } = this.props
    const styles = getStyles(theme)

    return (
      <TouchableOpacity onPress={this.props.toggleBalanceVisibility} style={styles.headerContainer}>
        {isAccountBalanceVisible ? (
          <View>
            <EdgeText>{walletName}</EdgeText>
            <EdgeText style={styles.currencyText}>{currencyDenominationSymbol + ' ' + cryptoAmount + ' ' + currencyCode}</EdgeText>
            <EdgeText>{fiatSymbol + ' ' + fiatBalance + ' ' + fiatCurrencyCode}</EdgeText>
          </View>
        ) : (
          <View>
            <EdgeText style={styles.showBalanceText}>{s.strings.string_show_balance}</EdgeText>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  render() {
    const { currencyCode, currencyName, transactionsLength, theme } = this.props
    const styles = getStyles(theme)

    return (
      <View style={styles.container}>
        {this.renderBalanceBox()}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={Actions.request} style={styles.buttons}>
            <Fontello name="request" size={theme.rem(2.5)} color={theme.iconTappable} />
          </TouchableOpacity>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={Actions.scan} style={styles.buttons}>
            <Fontello name="send" size={theme.rem(2.5)} color={theme.iconTappable} />
          </TouchableOpacity>
        </View>
        <WiredProgressBar progress={getSelectedWalletLoadingPercent} />
        {transactionsLength !== 0 && Constants.getSpecialCurrencyInfo(currencyCode).showEarnInterestCard && (
          <TouchableOpacity onPress={() => Actions[Constants.PLUGIN_EARN_INTEREST]({ plugin: guiPlugins.cred })} style={styles.earnInterestContainer}>
            <View style={styles.earnInterestBox}>
              <Image style={styles.earnInterestImage} source={credLogo} resizeMode="contain" />
              <T style={styles.earnInterestText}>{sprintf(s.strings.earn_interest_on, currencyName)}</T>
            </View>
          </TouchableOpacity>
        )}
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1
  },
  headerContainer: {
    height: theme.rem(5),
    padding: theme.rem(0.75),
    justifyContent: 'center'
  },
  currencyText: {
    fontSize: theme.rem(1.25),
    fontFamily: theme.fontFaceBold
  },
  showBalanceContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  showBalanceText: {
    fontSize: theme.rem(1.75)
  },
  buttonsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: theme.rem(1)
  },
  buttons: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonsIcon: {
    top: theme.rem(-1),
    width: theme.rem(4),
    height: theme.rem(1),
    borderLeftWidth: theme.rem(2 / 16),
    borderRightWidth: theme.rem(2 / 16),
    borderBottomWidth: theme.rem(2 / 16),
    borderColor: theme.iconTappable
  },
  spacer: {
    flex: 1
  },
  requestSendRow: {
    // two
    height: scale(50),
    flexDirection: 'row'
  },
  button: {
    borderRadius: scale(3)
  },
  requestBox: {
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
    marginRight: scale(2),
    flexDirection: 'row',
    borderColor: THEME.COLORS.GRAY_4
    // borderWidth: 0.1,
  },
  requestWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendBox: {
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    // opacity: THEME.OPACITY.MID,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(2),
    marginRight: scale(8),
    flexDirection: 'row',
    borderColor: THEME.COLORS.GRAY_4
    // borderWidth: 0.1,
  },
  sendWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  request: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    marginHorizontal: scale(12)
  },
  send: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    marginHorizontal: scale(12)
  },

  // beginning of second half
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },

  // Interest:
  earnInterestContainer: {
    backgroundColor: THEME.COLORS.GRAY_4,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(15),
    marginBottom: 0
  },
  earnInterestBox: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE,
    padding: scale(15)
  },
  earnInterestImage: {
    width: scale(32),
    height: scale(32),
    marginHorizontal: scale(4)
  },
  earnInterestText: {
    marginTop: scale(10),
    fontSize: scale(17),
    color: THEME.COLORS.GRAY_1
  }
}))

export const TransactionListTop = connect(
  (state: RootState) => {
    const selectedWalletId = state.ui.wallets.selectedWalletId
    const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode
    const guiWallet = state.ui.wallets.byId[selectedWalletId]
    const balance = guiWallet.nativeBalances[selectedCurrencyCode]

    // Crypto Amount Formatting
    const currencyDenomination = getDenomination(selectedCurrencyCode, state.ui.settings)
    const cryptoAmount: string = convertNativeToDenomination(currencyDenomination.multiplier)(balance) // convert to correct denomination
    const cryptoAmountFormat = cryptoAmount ? intl.formatNumber(decimalOrZero(bns.toFixed(cryptoAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)

    // Fiat Balance Formatting
    const defaultDenomination = getDefaultDenomination(selectedCurrencyCode, state.ui.settings)
    const defaultCryptoAmount = convertNativeToDenomination(defaultDenomination.multiplier)(balance)
    const fiatBalance = convertCurrency(state, selectedCurrencyCode, guiWallet.isoFiatCurrencyCode, parseFloat(defaultCryptoAmount))
    const fiatBalanceFormat = intl.formatNumber(fiatBalance && fiatBalance > 0.000001 ? fiatBalance : 0, { toFixed: 2 })

    return {
      currencyCode: selectedCurrencyCode,
      currencyName: guiWallet.currencyNames[selectedCurrencyCode],
      currencyDenominationSymbol: currencyDenomination.symbol,
      cryptoAmount: cryptoAmountFormat,
      fiatCurrencyCode: guiWallet.fiatCurrencyCode,
      fiatBalance: fiatBalanceFormat,
      fiatSymbol: getFiatSymbol(guiWallet.isoFiatCurrencyCode),
      walletName: guiWallet.name,
      isAccountBalanceVisible: state.ui.settings.isAccountBalanceVisible,
      transactionsLength: state.ui.scenes.transactionList.transactions.length
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    toggleBalanceVisibility() {
      dispatch(toggleAccountBalanceVisibility())
    }
  })
)(withTheme(TransactionListTopComponent))
