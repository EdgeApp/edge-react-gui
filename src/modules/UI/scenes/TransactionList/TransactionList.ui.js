// @flow

import React, {Component} from 'react'
import strings from '../../../../locales/default'
import s from '../../../../locales/strings.js'
import {bns} from 'biggystring'
import {
  ActivityIndicator,
  Animated,
  Image,
  ListView,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  View
} from 'react-native'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import {Actions} from 'react-native-router-flux'
import Contacts from 'react-native-contacts'
import Permissions from 'react-native-permissions'
import styles, {styles as styleRaw} from './style'
import * as UTILS from '../../../utils'

import requestImage from '../../../../assets/images/transactions/transactions-request.png'
import sendImage from '../../../../assets/images/transactions/transactions-send.png'
import sentTypeImage from '../../../../assets/images/transactions/transaction-type-sent.png'
import receivedTypeImage from '../../../../assets/images/transactions/transaction-type-received.png'
import platform from '../../../../theme/variables/platform.js'

//import SearchBar from './components/SearchBar.ui'

import type {AbcTransaction, AbcDenomination} from 'airbitz-core-types'
import type {GuiWallet} from '../../../../types'

import WalletListModal
from '../../../UI/components/WalletListModal/WalletListModalConnector'
import * as Constants from '../../../../constants/indexConstants'

type Props = {
  getTransactions: (walletId: string, currencyCode: string) => void,
  updateExchangeRates: () => void,
  setContactList: (contacts: Array<any>) => void,
  transactionsSearchHidden: () => void,
  contacts: Array<any>,
  selectedWalletId: string,
  selectedCurrencyCode: string,
  loading: boolean,
  updatingBalance: boolean,
  transactions: Array<AbcTransaction>,
  multiplier: string,
  uiWallet: GuiWallet,
  displayDenomination: AbcDenomination,
  balanceInCrypto: string,
  fiatSymbol: string,
  balanceInFiat: number,
  fiatCurrencyCode: string,
  isoFiatCurrencyCode: string
}
type State = {
  focused: boolean,
  balanceBoxVisible: boolean,
  op: any,
  animation: any,
  balanceBoxOpacity: any,
  balanceBoxHeight: any,
  width: ?number,
  showBalance: boolean
}

type TransactionListTx = any

const SHOW_BALANCE_TEXT = s.strings.string_show_balance
const REQUEST_TEXT      = strings.enUS['fragment_request_subtitle']
const SEND_TEXT         = strings.enUS['fragment_send_subtitle']
const SENT_TEXT         = strings.enUS['fragment_transaction_list_sent_prefix']
const RECEIVED_TEXT     = strings.enUS['fragment_transaction_list_receive_prefix']
const UNCONFIRMED_TEXT  = strings.enUS['fragment_wallet_unconfirmed']

export default class TransactionList extends Component<Props, State> {
  state = {
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
    width: undefined
  }

  componentDidMount () {
    if (this.props.loading) return

    const walletId = this.props.selectedWalletId
    const currencyCode = this.props.selectedCurrencyCode
    this.props.updateExchangeRates()
    this.props.getTransactions(walletId, currencyCode)

    const permissionStatus = ['authorized', 'undetermined']
    if (!this.props.contact) {
      Permissions.check('contacts').then((response) => {
        if (permissionStatus.indexOf(response)) {
          Contacts.getAll((err, contacts) => {
            if (err === 'denied') {
              // error
            } else {
              // console.log('all contacts: ', contacts)
              contacts.sort((a, b) => a.givenName > b.givenName)
              this.props.setContactList(contacts)
            }
          })
        }
      })
    }
  }

  _onSearchChange = () => {
    // this.props.dispatch(updateSearchResults(null))
    // console.log('this._onSearchChange executing')
  }

  _onPressSearch = () => {
    //this.props.transactionsSearchVisible()
  }

  _onSearchExit = () => {
    this.props.transactionsSearchHidden()
  }

  loadMoreTransactions = () => {
    // console.log('Transactions.ui->loadMoreTransactions being executed')
  }

  _onFocus = () => {
    this.setState({focused: true})
    this._toggleCancelVisibility()
  }

  _onBlur = () => {
    this.setState({focused: false})
    this._toggleCancelVisibility()
  }

  _toggleCancelVisibility = () => {
    let toOpacity, toWidth, toBalanceBoxHeight, toBalanceBoxOpacity
    if (this.state.focused) {
      toOpacity = 0
      toWidth = 0
      toBalanceBoxHeight = 200
      toBalanceBoxOpacity = 1.0
      this.setState({balanceBoxVisible: true})

      Animated.parallel([
        Animated.sequence([
          Animated.timing(this.state.op, {toValue: toOpacity, duration: 200}),
          Animated.timing(this.state.animation,{toValue: toWidth, duration: 200})
        ]),
        Animated.sequence([Animated.timing(this.state.balanceBoxHeight,{toValue: toBalanceBoxHeight,duration: 400}),
          Animated.timing(this.state.balanceBoxOpacity,{toValue: toBalanceBoxOpacity, duration: 400})
        ])
      ]).start()
    } else {
      toOpacity = 1
      toWidth = 60
      toBalanceBoxHeight = 0
      toBalanceBoxOpacity = 0.0

      Animated.parallel([
        Animated.sequence([
          Animated.timing(this.state.animation,{toValue: toWidth, duration: 200}),
          Animated.timing(this.state.op, {toValue: toOpacity, duration: 200})
        ]),
        Animated.sequence([
          Animated.sequence([
            Animated.timing(this.state.balanceBoxOpacity, {toValue: toBalanceBoxOpacity, duration: 400})
          ]),
          Animated.timing(this.state.balanceBoxHeight,{toValue: toBalanceBoxHeight, duration: 400})
        ])
      ]).start(() => this.setState({balanceBoxVisible: false}))
    }
  }

  _onCancel = () => this.setState({width: 0})

  toggleShowBalance = () => this.setState({showBalance: !this.state.showBalance})

  renderDropUp = () => {
    if (this.props.showToWalletModal) {
      return (
        <WalletListModal
          topDisplacement={Constants.TRANSACTIONLIST_WALLET_DIALOG_TOP}
          type={Constants.FROM}
        />
      )
    }
    return null
  }

  render () {
    const {
      loading,
      updatingBalance,
      transactions,
      multiplier,
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
      return <ActivityIndicator style={{flex: 1, alignSelf: 'center'}} size={'large'}/>
    }

    // console.log('about to render txList, this is: ', this)
    let cryptoBalanceString
    let cryptoAmountString
    let renderableTransactionList = transactions.sort(function (a: any, b: any) {
      a = new Date(a.date)
      b = new Date(b.date)
      return a > b ? -1 : a < b ? 1 : 0
    })

    let completedTxList = renderableTransactionList.map((x, i) => {
      let newValue: TransactionListTx = x
      newValue.key = i
      newValue.multiplier = multiplier
      let txDate = new Date(x.date * 1000)

      // let time = formatAMPM(txDate)
      // let dateString = monthNames[month] + ' ' + day + ', ' + year // will we need to change date format based on locale?
      let dateString = txDate.toLocaleDateString('en-US', {month: 'short', day: '2-digit', year: 'numeric'})
      let time = txDate.toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric'})
      newValue.dateString = dateString
      newValue.time = time
      return newValue
    })
    let ds = new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2})
    let dataSrc = ds.cloneWithRows(completedTxList)
    let logo

    if (uiWallet.currencyCode !== selectedCurrencyCode) {
      for (let metatoken of uiWallet.metaTokens) {
        if (metatoken.currencyCode === selectedCurrencyCode) {
          logo = metatoken.symbolImage
        }
      }
    } else {
      logo = uiWallet.symbolImage
    }

    const cryptoAmount:string = UTILS.convertNativeToDisplay(displayDenomination.multiplier)(balanceInCrypto) // convert to correct denomination
    cryptoAmountString = cryptoAmount ? UTILS.decimalOrZero(bns.toFixed(cryptoAmount, 0, 6), 6) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)

    if (displayDenomination.symbol) {
      cryptoBalanceString = displayDenomination.symbol + ' ' + cryptoAmountString
    } else {
      cryptoBalanceString = cryptoAmountString + ' ' + selectedCurrencyCode
    }
    // beginning of fiat balance
    let fiatBalanceString
    let receivedFiatSymbol = fiatSymbol ? UTILS.getFiatSymbol(isoFiatCurrencyCode) : ''
    if (receivedFiatSymbol.length !== 1) {
      fiatBalanceString =  (balanceInFiat ? balanceInFiat.toFixed(2) : '0.00') + ' ' + fiatCurrencyCode
    } else {
      fiatBalanceString = receivedFiatSymbol + ' ' + (balanceInFiat ? balanceInFiat.toFixed(2) : (0.00).toFixed(2)) + ' ' + fiatCurrencyCode
    }
    // end of fiat balance

    return (
      <View style={[{width: '100%', height: platform.usableHeight + platform.toolbarHeight}, UTILS.border()]}>
        <Gradient style={{height: 66, width: '100%'}} />
        <ScrollView style={[UTILS.border(), styles.scrollView]}>
          <View style={[styles.container, UTILS.border()]}>
            <Animated.View style={[{height: this.state.balanceBoxHeight}, UTILS.border()]}>
              <Gradient style={[styles.currentBalanceBox, UTILS.border()]}>
                {this.state.balanceBoxVisible
                && <Animated.View style={{flex: 1, paddingTop: 10, paddingBottom: 20, opacity: this.state.balanceBoxOpacity}}>
                  {updatingBalance ? (
                    <View style={[styles.currentBalanceWrap]}>
                      <View style={[styles.updatingBalanceWrap]}>
                        <ActivityIndicator
                          animating={updatingBalance}
                          style={[styles.updatingBalance, {height: 40}]}
                          size='small' />
                      </View>
                    </View>
                      ) : (
                        <TouchableOpacity onPress={this.toggleShowBalance} style={[styles.currentBalanceWrap, UTILS.border()]}>
                          {this.state.showBalance ? (
                            <View style={styles.balanceShownContainer}>
                              <View style={[styles.iconWrap, UTILS.border()]}>
                                {logo
                                  ? <Image style={[{height: 28, width: 28, resizeMode: Image.resizeMode.contain}, UTILS.border()]} source={{uri: logo}} />
                                  : <T style={[styles.request]}>
                                      {displayDenomination.symbol}
                                    </T>
                                }
                              </View>
                              <View style={[styles.currentBalanceBoxBitsWrap, UTILS.border()]}>
                                <T numberOfLines={1} style={[styles.currentBalanceBoxBits, UTILS.border()]}>
                                  {cryptoBalanceString}
                                </T>
                              </View>
                              <View style={[styles.currentBalanceBoxDollarsWrap, UTILS.border()]}>
                                <T numberOfLines={1} style={[styles.currentBalanceBoxDollars, UTILS.border()]}>
                                  {fiatBalanceString}
                                </T>
                              </View>
                            </View>
                          ) : (
                            <View style={[UTILS.border(), styles.balanceHiddenContainer]}>
                              <T style={[styles.balanceHiddenText]}>
                                {SHOW_BALANCE_TEXT}
                              </T>
                            </View>
                          )}
                        </TouchableOpacity>
                      )}
                  <View style={[styles.requestSendRow, UTILS.border()]}>

                    <TouchableHighlight style={[styles.requestBox, styles.button]}
                      underlayColor={styleRaw.underlay.color}
                      onPress={Actions.request}>
                      <View style={[styles.requestWrap]}>
                        <Image
                          style={{width: 25, height: 25}}
                          source={requestImage}/>
                        <T style={[styles.request]}>
                          {REQUEST_TEXT}
                        </T>
                      </View>
                    </TouchableHighlight>

                    <TouchableHighlight style={[styles.sendBox, styles.button]}
                      underlayColor={styleRaw.underlay.color}
                      onPress={Actions.scan}>
                      <View style={[styles.sendWrap]}>
                        <Image
                          style={{width: 25, height: 25}}
                          source={sendImage} />
                        <T style={styles.send}>
                          {SEND_TEXT}
                        </T>
                      </View>
                    </TouchableHighlight>

                  </View>
                </Animated.View>
                  }
              </Gradient>
            </Animated.View>
            <View style={[styles.transactionsWrap]}>
              <ListView
                style={[styles.transactionsScrollWrap]}
                dataSource={dataSrc}
                renderRow={(tx) => this.renderTx(tx, completedTxList)}
                onEndReached={this.loadMoreTransactions}
                onEndReachedThreshold={60}
                enableEmptySections
                initialIterator={-1}
                removeClippedSubviews={false}
                />
            </View>
          </View>
        </ScrollView>
        {this.renderDropUp()}
      </View>
    )
  }

  _goToTxDetail = (abcTransaction, thumbnailPath) => {
    Actions.transactionDetails({abcTransaction, thumbnailPath})
  }

  isReceivedTransaction (tx: TransactionListTx) {
    return bns.gt(tx.nativeAmount, '0')
  }

  isSentTransaction (tx: TransactionListTx) {
    return !this.isReceivedTransaction(tx)
  }

  renderTx = (tx: TransactionListTx, completedTxList: Array<TransactionListTx>) => {
    let txColorStyle, txImage, lastOfDate, thumbnailPath, pendingTimeStyle, pendingTimeSyntax
    let txName = ''

    if (this.isSentTransaction(tx)) {
      // XXX -paulvp Why is this hard coded here?
      txColorStyle = styles.accentRed
      txName = SENT_TEXT + this.props.uiWallet.currencyNames[this.props.selectedCurrencyCode]
      txImage = sentTypeImage
    } else {
      txColorStyle = styles.accentGreen
      txName = RECEIVED_TEXT + this.props.uiWallet.currencyNames[this.props.selectedCurrencyCode]
      txImage = receivedTypeImage
    }

    if (tx.metadata && tx.metadata.name) {
      if (this.props.contacts) {
        let contact = this.props.contacts.find((element) => {
          let fullName = (element.givenName && element.familyName) ? element.givenName + ' ' + element.familyName : element.givenName
          let found = (element.thumbnailPath && (UTILS.unspacedLowercase(fullName) === UTILS.unspacedLowercase(tx.metadata.name)))
          // if (found) console.log('element is: ', element)
          return found
        })
        if (contact) {
          thumbnailPath = contact.thumbnailPath
        }
      }
    }

    if (completedTxList[tx.key+1]) { // is there a subsequent transaction?
      lastOfDate = (tx.dateString === completedTxList[tx.key + 1].dateString) ? false : true
    } else {
      lastOfDate = false // 'lasteOfDate' may be a misnomer since the very last transaction in the list should have a bottom border
    }
    let stepOne = UTILS.convertNativeToDisplay(this.props.displayDenomination.multiplier)(bns.abs(tx.nativeAmount))

    let amountString = UTILS.decimalOrZero(UTILS.truncateDecimals(stepOne, 6), 6)
    let fiatSymbol = this.props.fiatSymbol ? UTILS.getFiatSymbol(this.props.isoFiatCurrencyCode) : ''
    let fiatAmountString
    if (tx.metadata && tx.metadata.amountFiat) {
      fiatAmountString = bns.abs(tx.metadata.amountFiat.toFixed(2))
      fiatAmountString = bns.toFixed(fiatAmountString, 2, 2)
    } else {
      fiatAmountString = '0.00'
    }

    if (tx.blockHeight <= 0) {
      pendingTimeStyle = styles.transactionPending
      pendingTimeSyntax = UNCONFIRMED_TEXT
    } else {
      pendingTimeStyle = styles.transactionTime
      pendingTimeSyntax = tx.time
    }

    return (
      <View style={[styles.singleTransactionWrap]}>
        {((tx.key === 0) || (tx.dateString !== completedTxList[tx.key - 1].dateString))
          && <View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <T style={styles.formattedDate}>
                {tx.dateString}
              </T>
            </View>
          </View>
        }
        <TouchableHighlight
          onPress={() => this._goToTxDetail(tx, thumbnailPath)}
          underlayColor={styleRaw.transactionUnderlay.color}
          style={[
            styles.singleTransaction,
            {borderBottomWidth: lastOfDate ? 0 : 1}
          ]}>
          <View style={[styles.transactionInfoWrap, UTILS.border()]}>

            <View style={styles.transactionLeft}>
              {thumbnailPath ? (
                <Image style={[styles.transactionLogo, UTILS.border()]} source={{uri: thumbnailPath}} />
              ) : (
                <Image
                  style={styles.transactionLogo}
                  source={txImage}
                />
              )}

              <View style={[styles.transactionLeftTextWrap, UTILS.border()]}>
                <T style={[styles.transactionPartner]}>
                  {tx.metadata && tx.metadata.name || txName}
                </T>
                <T style={[styles.transactionTimePendingArea, pendingTimeStyle]}>
                  {pendingTimeSyntax}
                </T>
              </View>

            </View>

            <View style={[styles.transactionRight, UTILS.border()]}>
              <T style={[styles.transactionBitAmount, txColorStyle]}>
                {this.props.displayDenomination.symbol} {amountString}
              </T>
              <T style={[styles.transactionDollarAmount, txColorStyle]}>
                {fiatSymbol + ' ' + fiatAmountString}
              </T>
            </View>

          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
