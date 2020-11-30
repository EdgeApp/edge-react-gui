// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { Image, TouchableHighlight, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import credLogo from '../../assets/images/cred_logo.png'
import requestImage from '../../assets/images/transactions/transactions-request.png'
import sendImage from '../../assets/images/transactions/transactions-send.png'
import * as Constants from '../../constants/indexConstants.js'
import { guiPlugins } from '../../constants/plugins/GuiPlugins.js'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { convertCurrency, getSelectedWalletLoadingPercent } from '../../modules/UI/selectors.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { scale } from '../../util/scaling.js'
import { convertNativeToDenomination, decimalOrZero, getDefaultDenomination, getDenomination, getFiatSymbol } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { WiredProgressBar } from './WiredProgressBar.js'

const BALANCE_BOX_OPACITY = 0.9

export type StateProps = {
  cryptoAmount: string,
  currencyDenominationSymbol: string,
  transactionsLength: number,
  currencyCode: string,
  currencyName: string,
  fiatCurrencyCode: string,
  fiatBalance: number,
  fiatSymbol: string,
  isAccountBalanceVisible: boolean
}

export type DispatchProps = {
  toggleBalanceVisibility: () => void
}

type Props = StateProps & DispatchProps & ThemeProps

class TransactionListTopComponent extends React.Component<Props> {
  render() {
    const {
      cryptoAmount,
      currencyCode,
      currencyName,
      currencyDenominationSymbol,
      fiatSymbol,
      fiatBalance,
      fiatCurrencyCode,
      isAccountBalanceVisible,
      transactionsLength,
      theme
    } = this.props

    // // should we get rid of "loading" area? Currently unused
    // if (loading) {
    //   return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size="large" />
    // }

    const styles = getStyles(theme)

    // beginning of fiat balance
    const fiatBalanceStringFormat = `${fiatSymbol} ${fiatBalance} ${fiatCurrencyCode}`
    const fiatBalanceString = fiatBalanceStringFormat.trim()

    return (
      <View>
        <TouchableOpacity onPress={this.props.toggleBalanceVisibility} style={styles.touchableBalanceBox} activeOpacity={BALANCE_BOX_OPACITY}>
          <Gradient style={styles.currentBalanceBox}>
            <View style={styles.balanceBoxContents}>
              {!isAccountBalanceVisible ? (
                <View style={styles.totalBalanceWrap}>
                  <View style={styles.hiddenBalanceBoxDollarsWrap}>
                    <T style={styles.currentBalanceBoxHiddenText}>{s.strings.string_show_balance}</T>
                  </View>
                </View>
              ) : (
                <View style={styles.balanceShownContainer}>
                  <View style={styles.currentBalanceBoxBitsWrap}>
                    <View style={{ flexDirection: 'row' }}>
                      {currencyDenominationSymbol ? (
                        <View style={{ flexDirection: 'row' }}>
                          <T numberOfLines={1} style={[styles.currentBalanceBoxBits, styles.symbol]}>
                            {currencyDenominationSymbol + ' '}
                          </T>
                          <T numberOfLines={1} style={[styles.currentBalanceBoxBits, styles.symbol]}>
                            {cryptoAmount}
                          </T>
                        </View>
                      ) : (
                        <T numberOfLines={1} style={styles.currentBalanceBoxBits}>
                          {cryptoAmount}
                        </T>
                      )}

                      {!currencyDenominationSymbol && (
                        <T numberOfLines={1} style={styles.currentBalanceBoxBits}>
                          {' ' + currencyCode}
                        </T>
                      )}
                    </View>
                  </View>
                  <View style={styles.currentBalanceBoxDollarsWrap}>
                    <T numberOfLines={1} style={styles.currentBalanceBoxDollars}>
                      {fiatBalanceString}
                    </T>
                  </View>
                </View>
              )}
              <View style={styles.requestSendRow}>
                <TouchableHighlight style={[styles.requestBox, styles.button]} underlayColor={THEME.COLORS.SECONDARY} onPress={Actions.request}>
                  <View style={styles.requestWrap}>
                    <Image style={{ width: 25, height: 25 }} source={requestImage} />
                    <T style={styles.request}>{s.strings.fragment_request_subtitle}</T>
                  </View>
                </TouchableHighlight>
                <TouchableHighlight style={[styles.sendBox, styles.button]} underlayColor={THEME.COLORS.SECONDARY} onPress={Actions.scan}>
                  <View style={styles.sendWrap}>
                    <Image style={{ width: 25, height: 25 }} source={sendImage} />
                    <T style={styles.send}>{s.strings.fragment_send_subtitle}</T>
                  </View>
                </TouchableHighlight>
              </View>
            </View>
          </Gradient>
          <WiredProgressBar progress={getSelectedWalletLoadingPercent} />
        </TouchableOpacity>
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
  touchableBalanceBox: {
    height: scale(200)
  },
  currentBalanceBox: {
    flex: 1,
    justifyContent: 'center'
  },
  totalBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  hiddenBalanceBoxDollarsWrap: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxHiddenText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(44)
  },
  balanceBoxContents: {
    flex: 1,
    paddingTop: scale(10),
    paddingBottom: scale(20),
    justifyContent: 'space-between'
  },
  balanceShownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  },
  currentBalanceBoxBitsWrap: {
    // two
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxBits: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(40)
  },
  currentBalanceBoxDollarsWrap: {
    justifyContent: 'flex-start',
    height: scale(26),
    paddingTop: scale(4),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxDollars: {
    // two
    color: THEME.COLORS.WHITE,
    fontSize: scale(20)
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
      transactionsLength: state.ui.scenes.transactionList.transactions.length,
      currencyCode: selectedCurrencyCode,
      currencyName: guiWallet.currencyNames[selectedCurrencyCode],
      currencyDenominationSymbol: currencyDenomination.symbol,
      cryptoAmount: cryptoAmountFormat,
      fiatCurrencyCode: guiWallet.fiatCurrencyCode,
      fiatBalance: fiatBalanceFormat,
      fiatSymbol: getFiatSymbol(guiWallet.isoFiatCurrencyCode),
      isAccountBalanceVisible: state.ui.settings.isAccountBalanceVisible
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    toggleBalanceVisibility() {
      dispatch(toggleAccountBalanceVisibility())
    }
  })
)(withTheme(TransactionListTopComponent))
