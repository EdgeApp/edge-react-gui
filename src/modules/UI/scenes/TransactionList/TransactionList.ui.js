// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Animated, FlatList, Image, TouchableHighlight, TouchableOpacity, View } from 'react-native'
// import Contacts from 'react-native-contacts'
// import Permissions from 'react-native-permissions'
import { Actions } from 'react-native-router-flux'
import slowlog from 'react-native-slowlog'

import requestImage from '../../../../assets/images/transactions/transactions-request.png'
import sendImage from '../../../../assets/images/transactions/transactions-send.png'
import * as Constants from '../../../../constants/indexConstants'
import { intl } from '../../../../locales/intl'
import s from '../../../../locales/strings.js'
import type { ContactsState } from '../../../../reducers/contacts/contactsReducer'
import type { GuiContact, GuiWallet, TransactionListTx } from '../../../../types'
import WalletListModal from '../../../UI/components/WalletListModal/WalletListModalConnector'
import * as UTILS from '../../../utils'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import SafeAreaView from '../../components/SafeAreaView'
import BuyCrypto from './components/BuyCrypto.ui.js'
import TransactionRow from './components/TransactionRowConnector.js'
import styles, { styles as styleRaw } from './style'

// import SearchBar from './components/SearchBar.ui'
const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5
const BALANCE_BOX_OPACITY = 0.9

export type StateProps = {
  loading: boolean,
  displayDenomination: EdgeDenomination,
  updatingBalance: boolean,
  transactions: Array<TransactionListTx>,
  contactsList: Array<GuiContact>,
  selectedWalletId: string,
  selectedCurrencyCode: string,
  isoFiatCurrencyCode: string,
  fiatCurrencyCode: string,
  uiWallet: GuiWallet,
  settings: Object,
  balanceInCrypto: string,
  balanceInFiat: number,
  multiplier: string,
  contacts: ContactsState,
  fiatSymbol: string,
  showToWalletModal: boolean,
  requiredConfirmations?: number,
  numTransactions: number,
  isBalanceVisible: boolean
}

export type DispatchProps = {
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => any,
  toggleBalanceVisibility: () => void,
  onSelectWallet: (string, string) => void
}

type Props = StateProps & DispatchProps

type State = {
  focused: boolean,
  op: any,
  animation: any,
  width: ?number,
  reset: boolean
}

const SHOW_BALANCE_TEXT = s.strings.string_show_balance
const REQUEST_TEXT = s.strings.fragment_request_subtitle
const SEND_TEXT = s.strings.fragment_send_subtitle

const emptyArray = []

export class TransactionList extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      reset: true,
      focused: false,
      animation: new Animated.Value(0),
      op: new Animated.Value(0),
      width: undefined
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentDidMount = () => {
    this.props.fetchMoreTransactions(this.props.selectedWalletId, this.props.selectedCurrencyCode, this.state.reset)
    if (this.state.reset) {
      this.setState({ reset: false })
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    if (nextProps.selectedWalletId !== this.props.selectedWalletId || nextProps.selectedCurrencyCode !== this.props.selectedCurrencyCode) {
      this.props.fetchMoreTransactions(nextProps.selectedWalletId, nextProps.selectedCurrencyCode, this.state.reset)
      if (this.state.reset) {
        this.setState({ reset: false })
      }
    }
  }

  handleScrollEnd = () => {
    this.props.fetchMoreTransactions(this.props.selectedWalletId, this.props.selectedCurrencyCode, this.state.reset)
    if (this.state.reset) {
      this.setState({ reset: false })
    }
  }

  renderDropUp = () => {
    const { onSelectWallet, showToWalletModal } = this.props
    if (showToWalletModal) {
      return <WalletListModal topDisplacement={Constants.TRANSACTIONLIST_WALLET_DIALOG_TOP} type={Constants.FROM} onSelectWallet={onSelectWallet} />
    }
    return null
  }

  renderBuyCrypto = () => {
    const wallet = this.props.uiWallet
    if (this.props.numTransactions) {
      return (
        <View style={styles.emptyListLoader}>
          <ActivityIndicator size={'large'} />
        </View>
      )
    }

    let currencyCode = ''
    if (wallet && wallet.currencyCode) {
      currencyCode = wallet.currencyCode
    }
    switch (currencyCode) {
      case 'BTC':
        return <BuyCrypto wallet={wallet} />
      case 'BCH':
        return <BuyCrypto wallet={wallet} />
      case 'ETH':
        return <BuyCrypto wallet={wallet} />
      case 'LTC':
        return <BuyCrypto wallet={wallet} />
      default:
        return null
    }
  }

  render () {
    const txs = this.state.reset ? emptyArray : this.props.transactions
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.scrollView}>
            <View style={styles.container}>
              <View style={styles.transactionsWrap}>
                <FlatList
                  ListEmptyComponent={this.renderBuyCrypto()}
                  ListHeaderComponent={this.currentRenderBalanceBox()}
                  style={styles.transactionsScrollWrap}
                  data={txs}
                  renderItem={this.renderTx}
                  initialNumToRender={INITIAL_TRANSACTION_BATCH_NUMBER}
                  onEndReached={this.handleScrollEnd}
                  onEndReachedThreshold={SCROLL_THRESHOLD}
                />
              </View>
            </View>
          </View>
          {this.renderDropUp()}
        </View>
      </SafeAreaView>
    )
  }

  currentRenderBalanceBox = () => {
    const {
      loading,
      uiWallet,
      selectedCurrencyCode,
      displayDenomination,
      balanceInCrypto,
      fiatSymbol,
      balanceInFiat,
      fiatCurrencyCode,
      isoFiatCurrencyCode,
      isBalanceVisible
    } = this.props

    // should we get rid of "loading" area? Currently unused
    if (loading) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'large'} />
    }

    let logo

    if (uiWallet.currencyCode !== selectedCurrencyCode) {
      for (const metatoken of uiWallet.metaTokens) {
        if (metatoken.currencyCode === selectedCurrencyCode) {
          logo = metatoken.symbolImage
        }
      }
    } else {
      logo = uiWallet.symbolImage
    }

    const cryptoAmount: string = UTILS.convertNativeToDisplay(displayDenomination.multiplier)(balanceInCrypto) // convert to correct denomination
    const cryptoAmountString = cryptoAmount ? intl.formatNumber(UTILS.decimalOrZero(bns.toFixed(cryptoAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)

    // beginning of fiat balance
    let fiatBalanceString
    const receivedFiatSymbol = fiatSymbol ? UTILS.getFiatSymbol(isoFiatCurrencyCode) : ''
    if (receivedFiatSymbol.length !== 1) {
      fiatBalanceString = intl.formatNumber(balanceInFiat || 0, { toFixed: 2 }) + ' ' + fiatCurrencyCode
    } else {
      fiatBalanceString = receivedFiatSymbol + ' ' + intl.formatNumber(balanceInFiat || 0, { toFixed: 2 }) + ' ' + fiatCurrencyCode
    }
    return (
      <TouchableOpacity onPress={this.props.toggleBalanceVisibility} style={styles.touchableBalanceBox} activeOpacity={BALANCE_BOX_OPACITY}>
        <Gradient style={[styles.currentBalanceBox]}>
          <View style={styles.balanceBoxContents}>
            {!isBalanceVisible ? (
              <View style={[styles.totalBalanceWrap]}>
                <View style={[styles.hiddenBalanceBoxDollarsWrap]}>
                  <T style={[styles.currentBalanceBoxHiddenText]}>{SHOW_BALANCE_TEXT}</T>
                </View>
              </View>
            ) : (
              <View style={styles.balanceShownContainer}>
                <View style={[styles.iconWrap]}>
                  {logo ? (
                    <Image style={[{ height: '100%' }]} source={{ uri: logo }} resizeMode={'cover'} />
                  ) : (
                    <T style={[styles.request]}>{displayDenomination.symbol}</T>
                  )}
                </View>
                <View style={[styles.currentBalanceBoxBitsWrap]}>
                  <View style={{ flexDirection: 'row' }}>
                    {displayDenomination.symbol ? (
                      <T numberOfLines={1} style={[styles.currentBalanceBoxBits, styles.symbol]}>
                        {displayDenomination.symbol + ' '}
                        <T numberOfLines={1}>{cryptoAmountString}</T>
                      </T>
                    ) : (
                      <T numberOfLines={1} style={styles.currentBalanceBoxBits}>
                        {cryptoAmountString}
                      </T>
                    )}

                    {!displayDenomination.symbol && (
                      <T numberOfLines={1} style={styles.currentBalanceBoxBits}>
                        {' ' + selectedCurrencyCode}
                      </T>
                    )}
                  </View>
                </View>
                <View style={[styles.currentBalanceBoxDollarsWrap]}>
                  <T numberOfLines={1} style={[styles.currentBalanceBoxDollars]}>
                    {fiatBalanceString}
                  </T>
                </View>
              </View>
            )}
            <View style={[styles.requestSendRow]}>
              <TouchableHighlight style={[styles.requestBox, styles.button]} underlayColor={styleRaw.underlay.color} onPress={Actions.request}>
                <View style={[styles.requestWrap]}>
                  <Image style={{ width: 25, height: 25 }} source={requestImage} />
                  <T style={[styles.request]}>{REQUEST_TEXT}</T>
                </View>
              </TouchableHighlight>
              <TouchableHighlight style={[styles.sendBox, styles.button]} underlayColor={styleRaw.underlay.color} onPress={Actions.scan}>
                <View style={[styles.sendWrap]}>
                  <Image style={{ width: 25, height: 25 }} source={sendImage} />
                  <T style={styles.send}>{SEND_TEXT}</T>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        </Gradient>
      </TouchableOpacity>
    )
  }

  goToTxDetail = (edgeTransaction: EdgeTransaction, thumbnailPath: string) => {
    Actions.transactionDetails({ edgeTransaction, thumbnailPath })
  }

  renderTx = (transaction: TransactionListTx) => {
    return (
      <TransactionRow
        transaction={transaction}
        transactions={this.props.transactions}
        selectedCurrencyCode={this.props.selectedCurrencyCode}
        contacts={this.props.contacts}
        uiWallet={this.props.uiWallet}
        displayDenomination={this.props.displayDenomination}
        isoFiatCurrencyCode={this.props.isoFiatCurrencyCode}
        fiatCurrencyCode={this.props.fiatCurrencyCode}
        onClick={this.goToTxDetail}
        fiatSymbol={this.props.fiatSymbol}
        requiredConfirmations={this.props.requiredConfirmations}
      />
    )
  }
}
