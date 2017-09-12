import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import PropTypes from 'prop-types'
import {
  TextInput,
  Image,
  ScrollView,
  ListView,
  Text,
  View,
  TouchableHighlight,
  Animated,
  ActivityIndicator,
  TouchableOpacity} from 'react-native'
import T from '../../components/FormattedText'
import {connect} from 'react-redux'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import LinearGradient from 'react-native-linear-gradient'
import {Actions} from 'react-native-router-flux'
import {
  transactionsSearchVisible,
  transactionsSearchHidden,
  getTransactionsRequest
} from './action'
import {updateExchangeRates} from '../../components/ExchangeRate/action'
import Contacts from 'react-native-contacts'
import Permissions from 'react-native-permissions'
import {setContactList} from '../../contacts/action'
import styles from './style'
import {colors as c} from '../../../../theme/variables/airbitz.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as UTILS from '../../../utils'

import requestImage from '../../../../assets/images/transactions/transactions-request.png'
import sendImage from '../../../../assets/images/transactions/transactions-send.png'
import sentTypeImage from '../../../../assets/images/transactions/transaction-type-sent.png'
import receivedTypeImage from '../../../../assets/images/transactions/transaction-type-received.png'

class TransactionList extends Component {
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
    const walletId = this.props.selectedWalletId
    const currencyCode = this.props.selectedCurrencyCode
    this.props.dispatch(updateExchangeRates())
    this.props.getTransactions(walletId, currencyCode)

    const permissionStatus = ['authorized', 'undetermined']
    if (!this.props.contact) {
      Permissions.check('contacts').then((response) => {
        if (permissionStatus.indexOf(response)) {
          Contacts.getAll((err, contacts) => {
            if (err === 'denied') {
              // error
            } else {
              console.log('all contacts: ', contacts)
              contacts.sort((a, b) => a.givenName > b.givenName)
              this.props.dispatch(setContactList(contacts))
            }
          })
        }
      })
    }
  }

  _onSearchChange = () => {
    // this.props.dispatch(updateSearchResults(null))
    console.log('this._onSearchChange executing')
  }

  _onPressSearch = () => {
    this.props.dispatch(transactionsSearchVisible())
  }

  _onSearchExit = () => {
    this.props.dispatch(transactionsSearchHidden())
  }

  loadMoreTransactions = () => {
    console.log('Transactions.ui->loadMoreTransactions being executed')
  }

  _onFocus = () => {
    this.setState({
      focused: true
    })
    this._toggleCancelVisibility()
  }

  _onBlur = () => {
    this.setState({
      focused: false
    })
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
      toBalanceBoxOpacity = 0.0

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
    console.log('about to render txList, this is: ', this)
    let cryptoBalanceString
    let cryptoAmountString
    let renderableTransactionList = this.props.transactions.sort(function (a, b) {
      a = new Date(a.date)
      b = new Date(b.date)
      return a > b ? -1 : a < b ? 1 : 0
    })

    let completedTxList = renderableTransactionList.map((x, i) => {
      let newValue = x
      newValue.key = i
      newValue.multiplier = this.props.multiplier
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

    if (this.props.uiWallet.currencyCode !== this.props.selectedCurrencyCode) {
      for (let metatoken of this.props.uiWallet.metaTokens) {
        if (metatoken.currencyCode === this.props.selectedCurrencyCode) {
          logo = metatoken.symbolImage
        }
      }
    } else {
      logo = this.props.uiWallet.symbolImage
    }

    const cryptoAmount:string = UTILS.convertNativeToDisplay(this.props.displayDenomination.multiplier)(this.props.balanceInCrypto)
    cryptoAmountString = cryptoAmount ? UTILS.truncateDecimals(cryptoAmount.toString(), 6) : '0'

    if (this.props.displayDenomination.symbol) {
      cryptoBalanceString = this.props.displayDenomination.symbol + ' ' + cryptoAmountString
    } else {
      cryptoBalanceString = cryptoAmountString + ' ' + this.props.selectedCurrencyCode
    }

    return (
      <ScrollView style={[UTILS.border(), styles.scrollView]} contentOffset={{x: 0, y: 44}}>
        <SearchBar state={this.state} onChangeText={this._onSearchChange} onBlur={this._onBlur} onFocus={this._onFocus} onPress={this._onCancel} />
        <View style={[styles.container, UTILS.border()]}>
          <Animated.View style={[{height: this.state.balanceBoxHeight}, UTILS.border()]}>
            <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.currentBalanceBox, UTILS.border()]} colors={[c.gradient.light, c.gradient.dark]}>
              {this.state.balanceBoxVisible &&
              <Animated.View style={{flex: 1, paddingTop: 10, paddingBottom: 20, opacity: this.state.balanceBoxOpacity}}>
                {this.props.updatingBalance ? (
                  <View style={[styles.currentBalanceWrap]}>
                    <View style={[styles.updatingBalanceWrap]}>
                      <ActivityIndicator
                        animating={this.props.updatingBalance}
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
                                : <T style={[styles.request]}>{this.props.displayDenomination.symbol}</T>
                              }
                            </View>
                            <View style={[styles.currentBalanceBoxBitsWrap, UTILS.border()]}>
                              <T numberOfLines={1} style={[styles.currentBalanceBoxBits, UTILS.border()]}>
                                {cryptoBalanceString}
                              </T>
                            </View>
                            <View style={[styles.currentBalanceBoxDollarsWrap, UTILS.border()]}>
                              <T numberOfLines={1} style={[styles.currentBalanceBoxDollars, UTILS.border()]}>
                                {this.props.settings.defaultFiat} {this.props.balanceInFiat.toFixed(2)}
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
            </LinearGradient>
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

  _goToTxDetail = (txId, currencyCode, tx) => {
    Actions.transactionDetails({walletId: this.props.selectedWalletId, txId, currencyCode, tx})
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
      // XXX -paulvp Why is this hard coded here. This should use a style guide
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
          if (found) console.log('element is: ', element)
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
    console.log('rendering tx, tx.nativeAmount is: ', tx.nativeAmount, ' stepOne is: ' , stepOne, ' , amountString is: ', amountString)
    return (
      <View style={[styles.singleTransactionWrap]}>
        {((tx.key === 0) || (tx.dateString !== completedTxList[tx.key - 1].dateString)) &&
          <View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <T style={styles.formattedDate}>{tx.dateString}</T>
            </View>
          </View>
        }
        <TouchableOpacity onPress={() => this._goToTxDetail(tx.txid, this.props.selectedCurrencyCode, tx)} style={[styles.singleTransaction, {borderBottomWidth: lastOfDate ? 0 : 1}]}>
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
                <T style={[styles.transactionPartner]}>{tx.metadata.name || txName}</T>
                <T style={[styles.transactionTime]}>{tx.time}</T>
              </View>
            </View>
            <View style={[styles.transactionRight, UTILS.border()]}>
              <T style={[styles.transactionBitAmount, txColorStyle]}>
                {this.props.displayDenomination.symbol} {amountString}
              </T>
              <T style={[styles.transactionDollarAmount, txColorStyle]}>
                {this.props.fiatSymbol + ' ' + (tx.metadata.amountFiat ? UTILS.addFiatTwoDecimals(UTILS.truncateDecimals(Math.abs(tx.metadata.amountFiat).toString(), 2)) : (0.00).toFixed(2))}
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

const mapStateToProps = (state) => {
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const fiatSymbol = UTILS.getFiatSymbol(UI_SELECTORS.getSelectedWallet(state).fiatCurrencyCode)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const balanceInCrypto = wallet.nativeBalances[currencyCode]
  const transactions = UI_SELECTORS.getTransactions(state)
  const index = SETTINGS_SELECTORS.getDisplayDenominationKey(state, currencyCode)
  const denomination = wallet.allDenominations[currencyCode][index]
  const multiplier = denomination.multiplier
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, currencyCode)
  const balanceInCryptoDisplay = UTILS.convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, balanceInCryptoDisplay)
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  return {
    // updatingBalance: state.ui.scenes.transactionList.updatingBalance,
    displayDenomination,
    updatingBalance: false,
    transactions,
    searchVisible: state.ui.scenes.transactionList.searchVisible,
    contactsList: state.ui.scenes.transactionList.contactsList,
    selectedWalletId,
    selectedCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    uiWallet: wallet,
    settings,
    balanceInCrypto,
    balanceInFiat,
    currencyConverter,
    multiplier,
    contacts: state.ui.contacts.contactList,
    fiatSymbol
  }
}

const mapDispatchToProps = dispatch => ({
  getTransactions: (walletId, currencyCode) => { dispatch(getTransactionsRequest(walletId, currencyCode)) }
})

const TransactionListConnect = connect(mapStateToProps, mapDispatchToProps)(TransactionList)
export default TransactionListConnect

class SearchBar extends Component {
  constructor (props) {
    super(props)
    this.state = this.props.state
  }

  render () {
    return (
      <View style={[styles.searchContainer, UTILS.border()]}>
        <View style={[styles.innerSearch, UTILS.border()]}>
          <EvilIcons name='search' style={[styles.searchIcon, UTILS.border()]} color='#9C9C9D' size={20} />
          <TextInput style={[styles.searchInput, UTILS.border()]} onChangeText={this.props.onSearchChange} onBlur={this.props.onBlur} onFocus={this.props.onFocus} placeholder={sprintf(strings.enUS['string_search'])} />
        </View>
        <Animated.View style={{width: this.state.animation, opacity: this.state.op}}>
          <TouchableHighlight onPress={this.props.onPress} style={[UTILS.border(), styles.cancelButton]}>
            <Text style={{color: 'white', backgroundColor: 'transparent'}}>{sprintf(strings.enUS['string_cancel_cap'])}</Text>
          </TouchableHighlight>
        </Animated.View>
      </View>
    )
  }
}
