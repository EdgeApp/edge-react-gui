// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { selectWalletFromModal } from '../../actions/WalletActions.js'
import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { convertCurrency } from '../../selectors/WalletSelectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { convertNativeToDenomination, getDefaultDenomination, getDenomination, getFiatSymbol } from '../../util/utils'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeTextFieldOutlined } from './EdgeOutlinedField'
import { EdgeText } from './EdgeText.js'
import { SceneHeader } from './SceneHeader'
import { WalletProgressIcon } from './WalletProgressIcon.js'

type OwnProps = {
  walletId: string,
  isEmpty: boolean,
  searching: boolean,
  onChangeSortingState: (isSearching: boolean) => void,
  onSearchTransaction: (searchString: string) => void
}

type StateProps = {
  cryptoAmount: string,
  currencyCode: string,
  denominationName: string,
  fiatCurrencyCode: string,
  fiatBalance: string,
  fiatSymbol: string,
  walletName: string,
  isAccountBalanceVisible: boolean
}

type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void,
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

  handleOpenWalletListModal = () => {
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} />).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        this.props.onSelectWallet(walletId, currencyCode)
      }
    })
  }

  renderBalanceBox = () => {
    const { cryptoAmount, currencyCode, denominationName, fiatSymbol, fiatBalance, fiatCurrencyCode, walletId, walletName, isAccountBalanceVisible, theme } =
      this.props
    const styles = getStyles(theme)

    return (
      <View style={styles.balanceBoxContainer}>
        <View style={styles.balanceBoxRow}>
          <View style={styles.balanceBoxBalanceContainer}>
            <View style={styles.balanceBoxWalletNameCurrencyContainer}>
              <TouchableOpacity style={styles.balanceBoxWalletNameContainer} onPress={this.handleOpenWalletListModal}>
                <EdgeText style={styles.balanceBoxWalletName}>{walletName}</EdgeText>
                <Ionicons name="chevron-forward" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
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
                <TouchableOpacity onPress={Actions.send} style={styles.buttons}>
                  <Ionicons name="arrow-up" size={theme.rem(1.5)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonsText}>{s.strings.fragment_send_subtitle}</EdgeText>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {!isEmpty && !searching && (
          <SceneHeader underline>
            <EdgeText style={styles.transactionsDividerText}>{s.strings.fragment_transaction_list_transaction}</EdgeText>
          </SceneHeader>
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
  balanceBoxWalletNameCurrencyContainer: {
    flexDirection: 'row'
  },
  balanceBoxWalletNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  balanceBoxWalletName: {
    marginRight: theme.rem(0.25),
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

  // Transactions Divider
  transactionsDividerText: {
    fontFamily: theme.fontFaceBold
  },

  searchContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(1)
  },
  searchDoneButton: {
    justifyContent: 'center',
    paddingLeft: theme.rem(0.75)
  }
}))

export const TransactionListTop = connect(
  (state: RootState): StateProps => {
    const selectedWalletId = state.ui.wallets.selectedWalletId
    const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode
    const guiWallet = state.ui.wallets.byId[selectedWalletId]
    const balance = guiWallet.nativeBalances[selectedCurrencyCode]

    // Crypto Amount Formatting
    const currencyDenomination = getDenomination(selectedCurrencyCode, state.ui.settings, 'display')
    const cryptoAmount: string = convertNativeToDenomination(currencyDenomination.multiplier)(balance) // convert to correct denomination
    const cryptoAmountFormat = intl.formatNumber(bns.add(cryptoAmount, '0'))

    // Fiat Balance Formatting
    const defaultDenomination = getDefaultDenomination(selectedCurrencyCode, state.ui.settings)
    const defaultCryptoAmount = convertNativeToDenomination(defaultDenomination.multiplier)(balance)
    const fiatBalance = convertCurrency(state, selectedCurrencyCode, guiWallet.isoFiatCurrencyCode, parseFloat(defaultCryptoAmount))
    const fiatBalanceFormat = intl.formatNumber(fiatBalance && fiatBalance > 0.000001 ? fiatBalance : 0, { toFixed: 2 })

    return {
      currencyCode: selectedCurrencyCode,
      cryptoAmount: cryptoAmountFormat,
      denominationName: currencyDenomination.name,
      fiatCurrencyCode: guiWallet.fiatCurrencyCode,
      fiatBalance: fiatBalanceFormat,
      fiatSymbol: getFiatSymbol(guiWallet.isoFiatCurrencyCode),
      walletName: guiWallet.name,
      isAccountBalanceVisible: state.ui.settings.isAccountBalanceVisible
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    toggleBalanceVisibility() {
      dispatch(toggleAccountBalanceVisibility())
    },
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWalletFromModal(walletId, currencyCode))
    }
  })
)(withTheme(TransactionListTopComponent))
