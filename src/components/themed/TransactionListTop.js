// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import credLogo from '../../assets/images/cred_logo.png'
import { Fontello } from '../../assets/vector/index.js'
import { getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import { guiPlugins } from '../../constants/plugins/GuiPlugins.js'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { convertCurrency } from '../../modules/UI/selectors.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { scale } from '../../util/scaling.js'
import { convertNativeToDenomination, decimalOrZero, getDefaultDenomination, getDenomination, getFiatSymbol } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { ButtonBox } from './ThemedButtons.js'

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

class TransactionListTopComponent extends React.PureComponent<Props> {
  renderEarnInterestCard = () => {
    const { currencyCode, transactionsLength, theme } = this.props
    const styles = getStyles(theme)

    if (transactionsLength !== 0 && getSpecialCurrencyInfo(currencyCode).showEarnInterestCard) {
      return (
        <ButtonBox onPress={() => Actions.pluginEarnInterest({ plugin: guiPlugins.cred })} paddingRem={0}>
          <View style={styles.earnInterestContainer}>
            <Image style={styles.earnInterestImage} source={credLogo} resizeMode="contain" />
            <EdgeText style={styles.earnInterestText}>{s.strings.earn_interest}</EdgeText>
          </View>
        </ButtonBox>
      )
    }
  }

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
    const { theme } = this.props
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
        {this.renderEarnInterestCard()}
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    padding: theme.rem(1)
  },

  // Balance Box
  headerContainer: {
    height: theme.rem(5),
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

  // Send/Receive Buttons
  buttonsContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.rem(1)
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

  // Earn Interest Card
  earnInterestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(6),
    backgroundColor: theme.tileBackground
  },
  earnInterestImage: {
    width: theme.rem(2.5),
    height: theme.rem(2.5),
    padding: theme.rem(1)
  },
  earnInterestText: {
    fontFamily: theme.fontFaceBold
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
