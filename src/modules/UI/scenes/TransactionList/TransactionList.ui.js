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
import { border as b } from '../../../utils'

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

class TransactionList extends Component {
   constructor(props) {
     super(props)
     this.state = {
      balance: 0,
      focused: false,
      animation: new Animated.Value(0),
      op: new Animated.Value(0),
      balanceBoxHeight: new Animated.Value(200),
      balanceBoxOpacity: new Animated.Value(1),
      balanceBoxVisible: true,
     }
   }

  componentDidMount () {
    this.props.dispatch(updateExchangeRates())
    this.props.getTransactions()
    this.setState({
      balance: this.props.wallet.getBalance(),
    })
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

  render () {
    console.log('the balance is: ', this.state.balance)
    console.log('rendering transactinlist', this.props.selectWalletId)
    var renderableTransactionList = this.props.transactions.sort(function (a, b) {
      a = new Date(a.date)
      b = new Date(b.date)
      return a > b ? -1 : a < b ? 1 : 0
    })
    var ds = new ListView.DataSource({ rowHasChanged: (row1, row2) => row1 !== row2 })
    var dataSource = ds.cloneWithRows(renderableTransactionList)
    // can also put dateIterator in here
    console.log('about to render transactionsList , this.state.balanceBoxVisible is: ' , this.state.balanceBoxVisible)
    console.log('about to render again, this.state.balanceBoxOpacity is: ', this.state.balanceBoxOpacity)
    return (
        <ScrollView style={[b(), styles.scrollView]} contentOffset={{x: 0,y: 44}}>
          <SearchBar state={this.state} onChangeText={this._onSearchChange} onBlur={this._onBlur} onFocus={this._onFocus} onPress={this._onCancel} />
          <View style={[styles.container, b('green')]}>
            <Animated.View style={[{height: this.state.balanceBoxHeight}, b('red')]}>
              <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={[styles.currentBalanceBox, b('purple')]} colors={["#3b7adb","#2b569a"]}>
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
                      <View style={[styles.currentBalanceWrap, b('green')]}>
                        <View style={[styles.bitcoinIconWrap, b('yellow')]}>
                          <FAIcon style={[styles.bitcoinIcon]} name="bitcoin" color="white" size={24} />
                        </View>
                        <View style={[styles.currentBalanceBoxDollarsWrap, b('yellow')]}>
                          <T style={[styles.currentBalanceBoxDollars, b('purple')]}>$ {this.props.exchangeRates.USD ? (6000 * this.props.exchangeRates.TRD.value).toFixed(2) : ''}</T>
                              </View>
                              <View style={[styles.currentBalanceBoxBitsWrap, b('red')]}>
                                <T style={[styles.currentBalanceBoxBits, b('yellow')]}>b 600000</T>
                              </View>
                          </View>
                          )}

                        <View style={[styles.requestSendRow, b('yellow')]}>
                          <TouchableHighlight style={[styles.requestBox, styles.button]}>
                            <View  style={[styles.requestWrap]}>
                              <FAIcon name="download" style={[styles.requestIcon]} color="#ffffff" size={24} />
                              <T style={[styles.request]}>{sprintf(strings.enUS['fragment_request_subtitle'])}</T>
                            </View>
                          </TouchableHighlight>
                          <TouchableHighlight onPress={() => Actions.scan()} style={[styles.sendBox, styles.button]}>
                            <View style={[styles.sendWrap]}>
                              <FAIcon name="upload" style={[styles.sendIcon]} color="#ffffff" size={24} onPress={() => Actions.scan()} />
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
                dataSource={dataSource}
                renderRow={this.renderTx}
                onEndReached={this.loadMoreTransactions}
                onEndReachedThreshold={60}
                enableEmptySections
              />
          </View>
        </View>
      </ScrollView>
    )
  }

  _goToTxDetail = ( txId, currencyCode, tx) => {
    Actions.transactionDetails({ walletId: this.props.selectedWalletId, txId, currencyCode, tx })
  }

  renderTx = (tx) => {
    let txDate = new Date(tx.date * 1000)
    let month = txDate.getMonth()
    let day = txDate.getDate()
    let year = txDate.getFullYear()
    let dateString = monthNames[month] + ' ' + day + ', ' + year // will we need to change date format based on locale?
    let sendReceiveSyntax, expenseIncomeSyntax, txColor
    dateStrings.push(dateString)
    if (tx.amountSatoshi <= 0) {
      sendReceiveSyntax = sprintf(strings.enUS['fragment_send_subtitle'])
      expenseIncomeSyntax = sprintf(strings.enUS['fragment_transaction_expense'])
      txColor = '#F03A47'
    } else {
      sendReceiveSyntax = sprintf(strings.enUS['fragment_transaction_receive'])
      expenseIncomeSyntax = sprintf(strings.enUS['fragment_transaction_income'])
      txColor = '#7FC343'
    }

    return (
      <View style={styles.singleTransactionWrap}>
        {(dateStrings[tx.key + 1] !== dateStrings[tx.key]) &&
          (<View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <T style={styles.formattedDate}>{dateString}</T>
            </View>
            {tx.key === 1 && (
              <View style={styles.rightDateSearch}>
                {(this.props.searchVisible === false) && (
                  <TouchableHighlight style={styles.firstDateSearchWrap} onPress={this._onPressSearch}>
                    <FAIcon name='search' size={16} style={styles.firstDateSearchIcon} color='#cccccc' />
                  </TouchableHighlight>
                )}
              </View>)}
          </View>)
        }
        <TouchableOpacity onPress={() => this._goToTxDetail( tx.txid, tx.currencyCode, tx)} style={[styles.singleTransaction, b()]}>
          <View style={[styles.transactionInfoWrap, b()]}>
            {tx.hasThumbnail ? (
              <Image style={[styles.transactionLogo, b()]} source={{ uri: tx.thumbnailPath }} />
            ) : (
              <FAIcon name='user' style={[styles.transactionLogo, b()]} size={54} />
            )}
            <View style={[styles.transactionDollars, b()]}>
              <T style={[styles.transactionPartner, b()]}>Contact Name</T>
              <T style={[styles.transactionTime, b()]}>12:12 PM</T>
            </View>
            <View style={[styles.transactionBits, b()]}>
              <T style={[styles.transactionDollarAmount, b(), {color: txColor} ]}>$ {(tx.amountSatoshi / 1000).toFixed(2)}</T>
              <T style={[styles.transactionBitAmount, b(), {color: txColor} ]}>{this.props.exchangeRates ? (tx.amountSatoshi * this.props.exchangeRates.TRD.value).toFixed(2) : ''}</T>
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
    contactsList: PropTypes.array
  }

const mapStateToProps = state => ({
  // updatingBalance: state.ui.transactionList.updatingBalance,
  updatingBalance: false,
  transactions:     state.ui.scenes.transactionList.transactions,
  searchVisible:    state.ui.scenes.transactionList.searchVisible,
  contactsList:     state.ui.scenes.transactionList.contactsList,
  exchangeRates:    state.ui.scenes.exchangeRate.exchangeRates,
  wallet:           state.core.wallets.byId[state.ui.wallets.selectedWalletId],
  selectedWalletId: state.ui.wallets.selectedWalletId
})

const mapDispatchToProps = dispatch => ({
  getTransactions: walletId => { dispatch(getTransactionsRequest(walletId)) }
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
