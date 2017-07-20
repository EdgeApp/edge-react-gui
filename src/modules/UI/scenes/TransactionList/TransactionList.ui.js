import React, { Component } from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import PropTypes from 'prop-types'
import { Easing, TextInput, Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated, ActivityIndicator, TouchableOpacity } from 'react-native'
import T from '../../components/FormattedText'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import {
  transactionsSearchVisible,
  transactionsSearchHidden,
  deleteTransactionsList,
  updateTransactionsList,
  updateContactsList,
  updateSearchResults,
  getTransactionsRequest } from './action'
import {updateExchangeRates} from '../../components/ExchangeRate/action'
import * as Animatable from 'react-native-animatable'
import Contacts from 'react-native-contacts'
import styles from './style'
import { border as b , findDenominationSymbol as symbolize, formatAMPM } from '../../../utils'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import request_image from '../../../../assets/images/transactions/transactions-request@3x.png.png'
import send_image from '../../../../assets/images/transactions/transactions-send@3x.png.png'
import sent_type_image from '../../../../assets/images/transactions/transaction-type-sent@3x.png.png'
import received_type_image from '../../../../assets/images/transactions/transaction-type-received@3x.png.png'

const monthNames = [
    sprintf(strings.enUS['transactions_list_date_jan']),
    sprintf(strings.enUS['transactions_list_date_feb']),
    sprintf(strings.enUS['transactions_list_date_mar']),
    sprintf(strings.enUS['transactions_list_date_apr']),
    sprintf(strings.enUS['transactions_list_date_may']),
    sprintf(strings.enUS['transactions_list_date_jun']),
    sprintf(strings.enUS['transactions_list_date_jul']),
    sprintf(strings.enUS['transactions_list_date_aug']),
    sprintf(strings.enUS['transactions_list_date_sep']),
    sprintf(strings.enUS['transactions_list_date_oct']),
    sprintf(strings.enUS['transactions_list_date_nov']),
    sprintf(strings.enUS['transactions_list_date_dec'])
  ]
var dateStrings = []
var iterator = -1

const checkTypeImage = (amount) => {
  if(amount > 0) {
    return received_type_image
  }
  if(amount <= 0) {
    return sent_type_image
  }
}

class TransactionList extends Component {
   constructor(props) {
     super(props)
     this.state = {
      //balance: 0,
      focused: false,
      animation: new Animated.Value(0),
      op: new Animated.Value(0),
      balanceBoxHeight: new Animated.Value(200),
      balanceBoxOpacity: new Animated.Value(1),
      balanceBoxVisible: true,
      showBalance: true,
      renderedTxCount: 0,
      completedTx: [],
      dataSrc: []
     }
     var completedTxList = []
   }

  componentDidMount () {
    const walletId = this.props.selectedWalletId
    const currencyCode = this.props.selectedCurrencyCode
    this.props.dispatch(updateExchangeRates())
    this.props.getTransactions(walletId, currencyCode)
  }

  contactSearch (nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].givenName === nameKey) {
        return myArray[i]
      }
    }
  }

  _onSearchChange = () => {
    //this.props.dispatch(updateSearchResults(null))
    console.log('this._onSearchChange executing')
  }

  _onPressSearch = (event) => {
    this.props.dispatch(transactionsSearchVisible())
  }

  _onSearchExit = (event) => {
    this.props.dispatch(transactionsSearchHidden())
  }

  loadMoreTransactions = () => {
    console.log('Transactions.ui->loadMoreTransactions being executed')
  }

  _onFocus = () => {
    this.setState({
      focused: true,
    })
    this._toggleCancelVisibility()
  }

  _onBlur = () => {
    this.setState({
      focused: false,
    })
    this._toggleCancelVisibility()
  }

  _toggleCancelVisibility = () => {
    let toOpacity, toWidth, toBalanceBoxHeight
    if(this.state.focused){
      toOpacity = 0
      toWidth = 0
      toBalanceBoxHeight = 200
      toBalanceBoxOpacity = 1.0
      this.setState({balanceBoxVisible: true}  )

      Animated.parallel([
        Animated.sequence([
          Animated.timing(
            this.state.op,
            {
              toValue: toOpacity,
              duration: 200
            }
          ),
          Animated.timing(
            this.state.animation,
            {
              toValue: toWidth,
              duration: 200
            }
          )
        ]),
        Animated.sequence([
          Animated.timing(
            this.state.balanceBoxHeight,
            {
              toValue: toBalanceBoxHeight,
              duration: 400
            }
          ),
          Animated.timing(
            this.state.balanceBoxOpacity,
            {
              toValue: toBalanceBoxOpacity,
              duration: 400
            }
          )
        ])
      ]).start()
    } else {
      toOpacity = 1
      toWidth = 60
      toBalanceBoxHeight = 0
      toBalanceBoxOpacity= 0.0

      Animated.parallel([
        Animated.sequence([
          Animated.timing(
            this.state.animation,
            {
              toValue: toWidth,
              duration: 200
            }
          ),
          Animated.timing(
            this.state.op,
            {
              toValue: toOpacity,
              duration: 200
            }
          )
        ]),
        Animated.sequence([
          Animated.sequence([
            Animated.timing(
              this.state.balanceBoxOpacity,
              {
                toValue: toBalanceBoxOpacity,
                duration: 400
              }
            )
        ]),
          Animated.timing(
            this.state.balanceBoxHeight,
            {
              toValue: toBalanceBoxHeight,
              duration: 400
            }
          )
        ])
      ]).start(() => this.setState({balanceBoxVisible: false}))
    }
  }

  _onCancel = () => {
    this.setState({
      width: 0
    })
  }

  toggleShowBalance = () => {
    this.setState({
      showBalance: !this.state.showBalance
    })
  }

  render () {
    console.log('inside transactionList->render and this.props is : ', this.props)
    var renderableTransactionList = this.props.transactions.sort(function (a, b) {
      a = new Date(a.date)
      b = new Date(b.date)
      return a > b ? -1 : a < b ? 1 : 0
    })

      completedTxList = renderableTransactionList.map((x, i) => {
      let newValue = x
      newValue.key = i
      newValue.multiplier = this.props.multiplier
      let txDate = new Date(x.date * 1000)
      let month = txDate.getMonth()
      let day = txDate.getDate()
      let year = txDate.getFullYear()
      let time = formatAMPM(txDate)
      let dateString = monthNames[month] + ' ' + day + ', ' + year // will we need to change date format based on locale?
      newValue.dateString = dateString
      newValue.time = time
      return newValue
    })
    console.log('completedTxList is: ', completedTxList)
    var ds = new ListView.DataSource({ rowHasChanged: (row1, row2) => row1 !== row2 })
    console.log('ds is: ', ds)
    let dataSrc = ds.cloneWithRows(completedTxList)
    console.log('rendering txList, datSrc is: ', dataSrc)
    console.log('rendering txList, this.props is: ', this.props)
    let logo
    console.log('mt stuff, this.props.uiWallet.currencyCode: ', this.props.uiWallet.currencyCode, ' , this.props.selectedCurrencyCode: ', this.props.selectedCurrencyCode)
    if(this.props.uiWallet.currencyCode != this.props.selectedCurrencyCode) {
      for(mt of this.props.uiWallet.metaTokens) {
        console.log('mt is: ', mt)
        if(mt.currencyCode === this.props.selectedCurrencyCode) {
          logo = mt.symbolImage
        }
      }
    } else {
      logo = this.props.uiWallet.symbolImage
    }
    console.log('logo is: ', logo)
    return (
        <ScrollView style={[b(), styles.scrollView]} contentOffset={{x: 0,y: 44}}>
          <SearchBar state={this.state} onChangeText={this._onSearchChange} onBlur={this._onBlur} onFocus={this._onFocus} onPress={this._onCancel} />
          <View style={[styles.container, b('green')]}>
            <Animated.View style={[{height: this.state.balanceBoxHeight}, b()]}>
              <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={[styles.currentBalanceBox, b()]} colors={["#3b7adb","#2b569a"]}>
                {this.state.balanceBoxVisible &&
                  <Animated.View style={{flex: 1, paddingTop: 10,paddingBottom: 20, opacity: this.state.balanceBoxOpacity}}>
                    {this.props.updatingBalance ? (
                      <View style={[styles.currentBalanceWrap]}>
                        <View style={[ styles.updatingBalanceWrap]}>
                          <ActivityIndicator
                            animating={this.props.updatingBalance}
                            style={[styles.updatingBalance, {height: 40}]}
                            size="small"
                          />
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={this.toggleShowBalance} style={[styles.currentBalanceWrap, b()]}>
                        {this.state.showBalance ? (
                          <View style={styles.balanceShownContainer}>
                            <View style={[styles.iconWrap, b()]}>
                              {logo && <Image style={{height: 28, width: 28, resizeMode: Image.resizeMode.contain}} source={{uri: logo}} />}
                            </View>
                            <View style={[styles.currentBalanceBoxDollarsWrap, b()]}>
                              <T style={[styles.currentBalanceBoxDollars, b()]}>{this.props.settings.defaultFiat} {(this.props.balanceInFiat / this.props.multiplier).toFixed(2)}</T>
                            </View>
                            <View style={[styles.currentBalanceBoxBitsWrap, b()]}>
                              <T style={[styles.currentBalanceBoxBits, b()]}>
                                {symbolize(this.props.uiWallet.denominations, this.props.uiWallet.currencyCode)} {((this.props.balanceInCrypto / this.props.multiplier)) || '0'}
                              </T>
                            </View>
                          </View>
                        ) : (
                          <View style={[b(), styles.balanceHiddenContainer]}>
                            <T style={[styles.balanceHiddenText]}>{sprintf(strings.enUS['string_show_balance'])}</T>
                          </View>
                        )
                        }
                      </TouchableOpacity>
                    )}
                    <View style={[styles.requestSendRow, b()]}>
                      <TouchableHighlight onPress={() => Actions.request() }style={[styles.requestBox, styles.button]}>
                        <View  style={[styles.requestWrap]}>
                          <Image
                            style={{width: 25, height: 25}}
                            source={request_image}
                          />
                          <T style={[styles.request]}>{sprintf(strings.enUS['fragment_request_subtitle'])}</T>
                        </View>
                      </TouchableHighlight>
                      <TouchableHighlight onPress={() => Actions.scan()} style={[styles.sendBox, styles.button]}>
                        <View style={[styles.sendWrap]}>
                          <Image
                            style={{width: 25, height: 25}}
                            source={send_image}
                          />
                          <T style={styles.send}>{sprintf(strings.enUS['fragment_send_subtitle'])}</T>
                        </View>
                      </TouchableHighlight>
                    </View>
                  </Animated.View>
                }
              </LinearGradient>
            </Animated.View>
            <View style={[styles.transactionsWrap]}>
              <ListView
                style={[styles.transactionsScrollWrap]}
                dataSource={dataSrc}
                renderRow={this.renderTx}
                onEndReached={this.loadMoreTransactions}
                onEndReachedThreshold={60}
                enableEmptySections
                initialIterator={-1}
              />
            </View>
          </View>
        </ScrollView>
    )
  }

  _goToTxDetail = ( txId, currencyCode, tx) => {
    return null
    // Actions.transactionDetails({ walletId: this.props.selectedWalletId, txId, currencyCode, tx })
  }

  renderTx = (tx) => {
    let sendReceiveSyntax, expenseIncomeSyntax, txColor
    if (tx.amountSatoshi <= 0) {
      sendReceiveSyntax = sprintf(strings.enUS['fragment_send_subtitle'])
      expenseIncomeSyntax = sprintf(strings.enUS['fragment_transaction_expense'])
      txColor = '#F03A47'
    } else {
      sendReceiveSyntax = sprintf(strings.enUS['fragment_transaction_receive'])
      expenseIncomeSyntax = sprintf(strings.enUS['fragment_transaction_income'])
      txColor = '#7FC343'
    }

    console.log('rendering row, tx is: ', tx,  ' tx.dateString is: ', tx.dateString, ' , and this.state is: ' , this.state, ' , and completedTxList is: ' , completedTxList)
    return (
      <View style={styles.singleTransactionWrap}>
        {((tx.key === 0) || (tx.dateString !== completedTxList[tx.key - 1].dateString)) &&
          <View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <T style={styles.formattedDate}>{tx.dateString}</T>
            </View>
          </View>
        }
        <TouchableOpacity onPress={() => this._goToTxDetail( tx.txid, tx.currencyCode, tx)} style={[styles.singleTransaction, b()]}>
          <View style={[styles.transactionInfoWrap, b()]}>
            <View style={styles.transactionLeft}>
              {tx.hasThumbnail ? (
                <Image style={[styles.transactionLogo, b()]} source={{ uri: tx.thumbnailPath }} />
              ) : (
                <Image
                  style={styles.transactionLogo}
                  source={checkTypeImage(tx.amountSatoshi)}
                />
              )}
              <View style={[styles.transactionLeftTextWrap, b()]}>
                <T style={[styles.transactionPartner]}>{tx.metadata.payee || 'No Name'}</T>
                <T style={[styles.transactionTime]}>{tx.time}</T>
              </View>
            </View>
            <View style={[styles.transactionRight, b()]}>
              <T style={[styles.transactionBitAmount, {color: txColor} ]}>{symbolize(this.props.uiWallet.denominations, this.props.uiWallet.currencyCode)} {(tx.amountSatoshi / tx.multiplier)}</T>
              <T style={[styles.transactionDollarAmount, {color: txColor} ]}>{tx.metadata.amountFiat && '$ ' + tx.metadata.amountFiat}</T>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    )
  }
}

TransactionList.propTypes = {
  transactionsList: PropTypes.array,
  searchVisible: PropTypes.bool,
  contactsList: PropTypes.array,
  balanceInCrypto: PropTypes.number,
  multiplier: PropTypes.number
}

const mapStateToProps = (state) => {
  const selectedWalletId     = UI_SELECTORS.getSelectedWalletId(state)
  const currencyCode         = UI_SELECTORS.getSelectedCurrencyCode(state)
  const wallet               = UI_SELECTORS.getSelectedWallet(state)
  const settings             = SETTINGS_SELECTORS.getSettings(state)
  const isoFiatCurrencyCode  = wallet.isoFiatCurrencyCode
  const currencyConverter    = CORE_SELECTORS.getCurrencyConverter(state)
  const balanceInCrypto      = wallet.balances[currencyCode]
  const balanceInFiat        = currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, balanceInCrypto)
  const transactions         = UI_SELECTORS.getTransactions(state)
  const index                = SETTINGS_SELECTORS.getDenominationIndex(state, currencyCode)
  const denomination         = wallet.allDenominations[currencyCode][index]
  const multiplier           = denomination.multiplier

  return {
    // updatingBalance: state.ui.scenes.transactionList.updatingBalance,
    updatingBalance: false,
    transactions,
    searchVisible:   state.ui.scenes.transactionList.searchVisible,
    contactsList:    state.ui.scenes.transactionList.contactsList,
    exchangeRates:   state.ui.scenes.exchangeRate.exchangeRates,
    selectedWalletId,
    selectedCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    uiWallet: wallet,
    settings,
    balanceInCrypto,
    balanceInFiat,
    currencyConverter,
    multiplier
  }
}

const mapDispatchToProps = dispatch => ({
  getTransactions: (walletId, currencyCode) => { dispatch(getTransactionsRequest(walletId, currencyCode)) }
})

export default TransactionListConnect = connect(mapStateToProps, mapDispatchToProps)(TransactionList)


class SearchBar extends Component {
  constructor(props) {
    super(props)
    this.state = this.props.state
  }

  render() {
    return(
      <View style={[styles.searchContainer, b()]}>
        <View style={[ styles.innerSearch, b()]}>
          <EvilIcons name='search' style={[styles.searchIcon, b()]} color='#9C9C9D' size={20} />
          <TextInput style={[styles.searchInput, b()]} onChangeText={this.props.onSearchChange} onBlur={this.props.onBlur} onFocus={this.props.onFocus} placeholder={sprintf(strings.enUS['string_search'])} />
        </View>
        <Animated.View style={{width: this.state.animation, opacity: this.state.op}}>
          <TouchableHighlight onPress={this.props.onPress} style={[b(), styles.cancelButton]}>
            <Text style={{color: 'white', backgroundColor: 'transparent'}}>{sprintf(strings.enUS['string_cancel_cap'])}</Text>
          </TouchableHighlight>
        </Animated.View>
      </View>
    )
  }
}
