// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import credLogo from '../../assets/images/cred_logo.png'
import { getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import { guiPlugins } from '../../constants/plugins/GuiPlugins.js'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { convertCurrency } from '../../modules/UI/selectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { convertNativeToDenomination, getDefaultDenomination, getDenomination, getFiatSymbol } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { EdgeTextFieldOutlined } from './EdgeTextField.js'
import { ButtonBox } from './ThemedButtons.js'
import { UnderlinedHeader } from './UnderlinedHeader'
import { WalletProgressIcon } from './WalletProgressIcon.js'

type OwnProps = {
  walletId: string,
  isEmpty: boolean,
  searching: boolean,
  onChangeSortingState: (isSearching: boolean) => void,
  onSearchTransaction: (searchString: string) => void
}

export type StateProps = {
  cryptoAmount: string,
  currencyDenominationSymbol: string,
  currencyCode: string,
  currencyName: string,
  denominationName: string,
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

type State = {
  input: string
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class TransactionListTopComponent extends React.PureComponent<Props, State> {
  textInput = React.createRef()

  constructor(props: Props) {
    super(props)
    this.state = {
      input: ''
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.searching === false && this.props.searching === true && this.textInput.current) {
      this.textInput.current.focus()
    }
  }

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
      denominationName,
      fiatSymbol,
      fiatBalance,
      fiatCurrencyCode,
      walletId,
      walletName,
      isAccountBalanceVisible,
      theme
    } = this.props
    const styles = getStyles(theme)

    return (
      <View style={styles.balanceBoxContainer}>
        <View style={styles.balanceBoxRow}>
          <View style={styles.balanceBoxBalanceContainer}>
            <View style={styles.balanceBoxWalletNameContainer}>
              <EdgeText style={styles.balanceBoxWalletName}>{walletName}</EdgeText>
              <WalletProgressIcon currencyCode={currencyCode} walletId={walletId} size={theme.rem(1.5)} />
            </View>
            <TouchableOpacity onPress={this.props.toggleBalanceVisibility}>
              {isAccountBalanceVisible ? (
                <>
                  <EdgeText style={styles.balanceBoxCurrency}>{cryptoAmount + ' ' + denominationName}</EdgeText>
                  <EdgeText style={styles.balanceFiatBalance}>{fiatSymbol + fiatBalance + ' ' + fiatCurrencyCode}</EdgeText>
                </>
              ) : (
                <EdgeText style={styles.balanceFiatShow}>{s.strings.string_show_balance}</EdgeText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  handleOnChangeText = (input: string) => {
    this.setState({ input })
  }

  handleTextFieldFocus = () => {
    this.props.onChangeSortingState(true)
  }

  handleTextFieldBlur = () => {
    this.props.onSearchTransaction(this.state.input)
  }

  handleSearchDone = () => {
    this.clearText()
    this.props.onChangeSortingState(false)
    if (this.textInput.current) {
      this.textInput.current.clear()
    }
  }

  clearText = () => {
    this.setState({ input: '' })
    this.props.onSearchTransaction('')
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  render() {
    const { isEmpty, searching, theme } = this.props
    const styles = getStyles(theme)

    return (
      <>
        <View style={styles.container}>
          {!isEmpty && (
            <View style={styles.searchContainer}>
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <EdgeTextFieldOutlined
                  returnKeyType="search"
                  label={s.strings.transaction_list_search}
                  onChangeText={this.handleOnChangeText}
                  value={this.state.input}
                  onFocus={this.handleTextFieldFocus}
                  onBlur={this.handleTextFieldBlur}
                  ref={this.textInput}
                  isClearable={searching}
                  onClear={this.clearText}
                  marginRem={0}
                />
              </View>
              {searching && (
                <TouchableOpacity onPress={this.handleSearchDone} style={styles.searchDoneButton}>
                  <EdgeText style={{ color: theme.textLink }}>{s.strings.string_done_cap}</EdgeText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!searching && (
            <>
              {this.renderBalanceBox()}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={Actions.request} style={styles.buttons}>
                  <Ionicons name="arrow-down" size={theme.rem(1.5)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonsText}>{s.strings.fragment_request_subtitle}</EdgeText>
                </TouchableOpacity>
                <View style={styles.buttonsDivider} />
                <TouchableOpacity onPress={Actions.scan} style={styles.buttons}>
                  <Ionicons name="arrow-up" size={theme.rem(1.5)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonsText}>{s.strings.fragment_send_subtitle}</EdgeText>
                </TouchableOpacity>
              </View>
              {this.renderEarnInterestCard()}
            </>
          )}
        </View>

        {!isEmpty && !searching && (
          <UnderlinedHeader>
            <EdgeText style={styles.transactionsDividerText}>{s.strings.fragment_transaction_list_transaction}</EdgeText>
          </UnderlinedHeader>
        )}
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    paddingLeft: theme.rem(1),
    marginBottom: theme.rem(0.5)
  },

  // Balance Box
  balanceBoxContainer: {
    height: theme.rem(5.25),
    marginVertical: theme.rem(1),
    marginRight: theme.rem(1)
  },
  balanceBoxRow: {
    flexDirection: 'row'
  },
  balanceBoxBalanceContainer: {
    flex: 1
  },
  balanceBoxWalletNameContainer: {
    flexDirection: 'row'
  },
  balanceBoxWalletName: {
    flex: 1,
    fontSize: theme.rem(1.25)
  },
  balanceBoxCurrency: {
    fontSize: theme.rem(2),
    fontFamily: theme.fontFaceBold
  },
  balanceFiatBalance: {
    fontSize: theme.rem(1.25)
  },
  balanceFiatShow: {
    fontSize: theme.rem(2)
  },

  // Send/Receive Buttons
  buttonsContainer: {
    flexDirection: 'row',
    marginBottom: theme.rem(1)
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.rem(6),
    height: theme.rem(3)
  },
  buttonsDivider: {
    width: theme.rem(2)
  },
  buttonsText: {
    fontSize: theme.rem(1),
    color: theme.textLink,
    fontFamily: theme.fontFaceBold,
    marginLeft: theme.rem(0.25)
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
  },

  // Transactions Divider
  transactionsDividerText: {
    fontFamily: theme.fontFaceBold
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.rem(1),
    height: theme.rem(4.5)
  },
  searchDoneButton: {
    paddingLeft: theme.rem(0.75),
    paddingRight: 0,
    paddingBottom: theme.rem(0.5)
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
    const cryptoAmountFormat = cryptoAmount && !bns.eq(cryptoAmount, '0') ? intl.formatNumber(cryptoAmount.replace(/0+$/, '')) : '0' // only cut off trailing zeroes (to the right of significant figures)

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
      denominationName: currencyDenomination.name,
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
