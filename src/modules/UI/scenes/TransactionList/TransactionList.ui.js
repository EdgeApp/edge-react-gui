import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import PropTypes from 'prop-types'
import {
  ActivityIndicator,
  Animated,
  Image,
  ListView,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import {Actions} from 'react-native-router-flux'
import Contacts from 'react-native-contacts'
import Permissions from 'react-native-permissions'
import styles from './style'
import * as UTILS from '../../../utils'

import requestImage from '../../../../assets/images/transactions/transactions-request.png'
import sendImage from '../../../../assets/images/transactions/transactions-send.png'
import sentTypeImage from '../../../../assets/images/transactions/transaction-type-sent.png'
import receivedTypeImage from '../../../../assets/images/transactions/transaction-type-received.png'
import SearchBar from './components/SearchBar.ui'

export default class TransactionList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      // balance: 0,
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
    this.props.transactionsSearchVisible()
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
    let renderableTransactionList = transactions.sort(function (a, b) {
      a = new Date(a.date)
      b = new Date(b.date)
      return a > b ? -1 : a < b ? 1 : 0
    })

    let completedTxList = renderableTransactionList.map((x, i) => {
      let newValue = x
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

    const cryptoAmount:string = UTILS.convertNativeToDisplay(displayDenomination.multiplier)(balanceInCrypto)
    cryptoAmountString = cryptoAmount ? UTILS.truncateDecimals(cryptoAmount.toString(), 6) : '0'

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
      <ScrollView style={[UTILS.border(), styles.scrollView]} contentOffset={{x: 0, y: 44}}>
        <SearchBar state={this.state} onChangeText={this._onSearchChange} onBlur={this._onBlur} onFocus={this._onFocus} onPress={this._onCancel} />
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
                        size='small'
                          />
                    </View>
                  </View>
                    ) : (
                      <TouchableOpacity onPress={this.toggleShowBalance} style={[styles.currentBalanceWrap, UTILS.border()]}>
                        {this.state.showBalance ? (
                          <View style={styles.balanceShownContainer}>
                            <View style={[styles.iconWrap, UTILS.border()]}>
                              {logo
                                ? <Image style={[{height: 28, width: 28, resizeMode: Image.resizeMode.contain}, UTILS.border()]} source={{uri: logo}} />
                                : <T style={[styles.request]}>{displayDenomination.symbol}</T>
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
                            <T style={[styles.balanceHiddenText]}>{sprintf(strings.enUS['string_show_balance'])}</T>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                <View style={[styles.requestSendRow, UTILS.border()]}>
                  <TouchableHighlight underlayColor='rgba(0,0,0,0.25)' onPress={() => Actions.request()} style={[styles.requestBox, styles.button]}>
                    <View style={[styles.requestWrap]}>
                      <Image
                        style={{width: 25, height: 25}}
                        source={requestImage}
                          />
                      <T style={[styles.request]}>{sprintf(strings.enUS['fragment_request_subtitle'])}</T>
                    </View>
                  </TouchableHighlight>
                  <TouchableHighlight underlayColor='rgba(0,0,0,0.25)' onPress={() => Actions.scan()} style={[styles.sendBox, styles.button]}>
                    <View style={[styles.sendWrap]}>
                      <Image
                        style={{width: 25, height: 25}}
                        source={sendImage}
                          />
                      <T style={styles.send}>{sprintf(strings.enUS['fragment_send_subtitle'])}</T>
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
              />
          </View>
        </View>
      </ScrollView>
    )
  }

  _goToTxDetail = (guiTransaction) => {
    Actions.transactionDetails({guiTransaction})
  }

  isReceivedTransaction (tx) {
    return UTILS.isGreaterThan('0')(tx.nativeAmount)
  }

  isSentTransaction (tx) {
    return !this.isReceivedTransaction(tx)
  }

  renderTx = (tx, completedTxList) => {
    let txColorStyle
    let txName = ''
    let txImage
    let lastOfDate

    if (this.isSentTransaction(tx)) {
      // XXX -paulvp Why is this hard coded here?
      txColorStyle = styles.accentRed
      txName = strings.enUS['fragment_transaction_list_sent_prefix'] + this.props.uiWallet.currencyNames[this.props.selectedCurrencyCode]
      txImage = sentTypeImage
    } else {
      txColorStyle = styles.accentGreen
      txName = strings.enUS['fragment_transaction_list_receive_prefix'] + this.props.uiWallet.currencyNames[this.props.selectedCurrencyCode]
      txImage = receivedTypeImage
    }

    if (tx.metadata.name) {
      if (this.props.contacts) {
        let contact = this.props.contacts.find((element) => {
          let found = (((element.givenName + ' ' + element.familyName) === tx.metadata.name) && element.hasThumbnail)
          // if (found) console.log('element is: ', element)
          return found
        })
        if (contact) {
          tx.thumbnailPath = contact.thumbnailPath
          tx.hasThumbnail = contact.hasThumbnail
        }
      }
    }

    if (completedTxList[tx.key+1]) { // is there a subsequent transaction?
      lastOfDate = (tx.dateString === completedTxList[tx.key + 1].dateString) ? false : true
    } else {
      lastOfDate = false // 'lasteOfDate' may be a misnomer since the very last transaction in the list should have a bottom border
    }
    let stepOne = UTILS.convertNativeToDisplay(this.props.displayDenomination.multiplier)(tx.nativeAmount.replace('-', ''))

    let amountString = Math.abs(parseFloat(UTILS.truncateDecimals(stepOne, 6)))
    // console.log('rendering tx, tx.nativeAmount is: ', tx.nativeAmount, ' stepOne is: ' , stepOne, ' , amountString is: ', amountString)
    let fiatSymbol = this.props.fiatSymbol ? UTILS.getFiatSymbol(this.props.isoFiatCurrencyCode) : ''
    let fiatAmountString
    if (tx.metadata.amountFiat) {
      let absoluteAmountFiat = Math.abs(tx.metadata.amountFiat)
      let absoluteAmountFiatString = absoluteAmountFiat.toString()
      let truncatedDecimalsAmountFiat = UTILS.truncateDecimals(absoluteAmountFiatString, 2)
      fiatAmountString = UTILS.addFiatTwoDecimals(truncatedDecimalsAmountFiat)
    } else {
      fiatAmountString = (0.00).toFixed(2)
    }

    const abcTransaction = {abcTransaction: tx}

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
        <TouchableOpacity onPress={() => this._goToTxDetail(abcTransaction)} style={[styles.singleTransaction, {borderBottomWidth: lastOfDate ? 0 : 1}]}>
          <View style={[styles.transactionInfoWrap, UTILS.border()]}>
            <View style={styles.transactionLeft}>
              {tx.thumbnailPath ? (
                <Image style={[styles.transactionLogo, UTILS.border()]} source={{uri: tx.thumbnailPath}} />
              ) : (
                <Image
                  style={styles.transactionLogo}
                  source={txImage}
                />
              )}
              <View style={[styles.transactionLeftTextWrap, UTILS.border()]}>
                <T style={[styles.transactionPartner]}>
                  {tx.metadata.name || txName}
                </T>
                <T style={[styles.transactionTime]}>
                  {tx.time}
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
        </TouchableOpacity>
      </View>
    )
  }
}

TransactionList.propTypes = {
  transactionsList: PropTypes.array,
  searchVisible: PropTypes.bool,
  contactsList: PropTypes.array,
  balanceInCrypto: PropTypes.string,
  multiplier: PropTypes.string
}
