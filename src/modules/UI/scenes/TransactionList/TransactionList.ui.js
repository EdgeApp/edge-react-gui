// @flow

import { bns } from 'biggystring'
import slowlog from 'react-native-slowlog'
import type { EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Animated, FlatList, Image, TouchableHighlight, TouchableOpacity, View } from 'react-native'
// import Contacts from 'react-native-contacts'
// import Permissions from 'react-native-permissions'
import { Actions } from 'react-native-router-flux'

import requestImage from '../../../../assets/images/transactions/transactions-request.png'
import sendImage from '../../../../assets/images/transactions/transactions-send.png'
import * as Constants from '../../../../constants/indexConstants'
import { intl } from '../../../../locales/intl'
import s from '../../../../locales/strings.js'
import type { GuiContact, GuiWallet, TransactionListTx } from '../../../../types'
import WalletListModal from '../../../UI/components/WalletListModal/WalletListModalConnector'
import * as UTILS from '../../../utils'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import SafeAreaView from '../../components/SafeAreaView'
import styles, { styles as styleRaw } from './style'
import type {ContactsState} from '../../../../reducers/contacts/contactsReducer'
import TransactionRow from './components/TransactionRowConnector.js'

// import SearchBar from './components/SearchBar.ui'
const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5

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
  currencyConverter: Object,
  multiplier: string,
  contacts: ContactsState,
  fiatSymbol: string,
  showToWalletModal: boolean,
  requiredConfirmations?: number
}

export type DispatchProps = {
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => any
}

type Props = StateProps & DispatchProps

type State = {
  focused: boolean,
  balanceBoxVisible: boolean,
  op: any,
  animation: any,
  balanceBoxOpacity: any,
  balanceBoxHeight: any,
  width: ?number,
  reset: boolean,
  showBalance: boolean
}

const SHOW_BALANCE_TEXT = s.strings.string_show_balance
const REQUEST_TEXT = s.strings.fragment_request_subtitle
const SEND_TEXT = s.strings.fragment_send_subtitle

const emptyArray = []

export class TransactionList extends Component<Props, State> {
  state = {
    reset: true,
    focused: false,
    animation: new Animated.Value(0),
    op: new Animated.Value(0),
    balanceBoxHeight: new Animated.Value(200),
    balanceBoxOpacity: new Animated.Value(1),
    balanceBoxVisible: true,
    showBalance: true,
    renderedTxCount: 0,
    completedTx: [],
    dataSrc: [],
    width: undefined,
    currentCurrencyCode: '',
    numTransactions: 0,
    currentWalletId: '',
    currentEndIndex: 0
  }

  constructor (props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentWillReceiveProps (nextProps: Props) {
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

  // _onSearchChange = () => {
  //   // this.props.dispatch(updateSearchResults(null))
  //   // console.log('this._onSearchChange executing')
  // }
  //
  // _onPressSearch = () => {
  //   // this.props.transactionsSearchVisible()
  // }
  //
  // _onSearchExit = () => {
  //   this.props.transactionsSearchHidden()
  // }
  //
  // loadMoreTransactions = () => {
  //   // console.log('Transactions.ui->loadMoreTransactions being executed')
  // }

  // // _onFocus = () => {
  // //   this.setState({ focused: true })
  // //   this._toggleCancelVisibility()
  // // }
  // //
  // // _onBlur = () => {
  // //   this.setState({ focused: false })
  // //   this._toggleCancelVisibility()
  // // }
  // //
  // _toggleCancelVisibility = () => {
  //   let toOpacity, toWidth, toBalanceBoxHeight, toBalanceBoxOpacity
  //   if (this.state.focused) {
  //     toOpacity = 0
  //     toWidth = 0
  //     toBalanceBoxHeight = 200
  //     toBalanceBoxOpacity = 1.0
  //     this.setState({ balanceBoxVisible: true })
  //
  //     Animated.parallel([
  //       Animated.sequence([
  //         Animated.timing(this.state.op, { toValue: toOpacity, duration: 200 }),
  //         Animated.timing(this.state.animation, { toValue: toWidth, duration: 200 })
  //       ]),
  //       Animated.sequence([
  //         Animated.timing(this.state.balanceBoxHeight, { toValue: toBalanceBoxHeight, duration: 400 }),
  //         Animated.timing(this.state.balanceBoxOpacity, { toValue: toBalanceBoxOpacity, duration: 400 })
  //       ])
  //     ]).start()
  //   } else {
  //     toOpacity = 1
  //     toWidth = 60
  //     toBalanceBoxHeight = 0
  //     toBalanceBoxOpacity = 0.0
  //
  //     Animated.parallel([
  //       Animated.sequence([
  //         Animated.timing(this.state.animation, { toValue: toWidth, duration: 200 }),
  //         Animated.timing(this.state.op, { toValue: toOpacity, duration: 200 })
  //       ]),
  //       Animated.sequence([
  //         Animated.sequence([Animated.timing(this.state.balanceBoxOpacity, { toValue: toBalanceBoxOpacity, duration: 400 })]),
  //         Animated.timing(this.state.balanceBoxHeight, { toValue: toBalanceBoxHeight, duration: 400 })
  //       ])
  //     ]).start(() => this.setState({ balanceBoxVisible: false }))
  //   }
  // }
  //
  // _onCancel = () => this.setState({ width: 0 })

  toggleShowBalance = () => {
    this.setState({ showBalance: !this.state.showBalance })
  }

  renderDropUp = () => {
    if (this.props.showToWalletModal) {
      return <WalletListModal topDisplacement={Constants.TRANSACTIONLIST_WALLET_DIALOG_TOP} type={Constants.FROM} />
    }
    return null
  }

  render () {
    const txs = this.state.reset ? emptyArray : this.props.transactions
    if (this.state.showBalance) {
      this.currentRenderBalanceBox = this.renderBalanceBoxTrue
    } else {
      this.currentRenderBalanceBox = this.renderBalanceBoxFalse
    }
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.scrollView}>
            <View style={styles.container}>
              <View style={styles.transactionsWrap}>
                <FlatList
                  ListHeaderComponent={this.currentRenderBalanceBox}
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

  renderBalanceBox = (showBalance: boolean) => () => {
    const {
      loading,
      uiWallet,
      selectedCurrencyCode,
      displayDenomination,
      balanceInCrypto,
      fiatSymbol,
      balanceInFiat,
      fiatCurrencyCode,
      isoFiatCurrencyCode
    } = this.props
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
      <Animated.View style={[{ height: this.state.balanceBoxHeight }]}>
        <Gradient style={[styles.currentBalanceBox]}>
          {this.state.balanceBoxVisible && (
            <Animated.View style={[styles.balanceBoxContents, { opacity: this.state.balanceBoxOpacity }]}>
              <TouchableOpacity onPress={this.toggleShowBalance} style={[styles.currentBalanceWrap]}>
                {showBalance ? (
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
                ) : (
                  <View style={[styles.balanceHiddenContainer]}>
                    <T style={[styles.balanceHiddenText]}>{SHOW_BALANCE_TEXT}</T>
                  </View>
                )}
              </TouchableOpacity>
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
            </Animated.View>
          )}
        </Gradient>
      </Animated.View>
    )
  }

  renderBalanceBoxTrue = this.renderBalanceBox(true)
  renderBalanceBoxFalse = this.renderBalanceBox(false)
  currentRenderBalanceBox = this.renderBalanceBoxTrue

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
