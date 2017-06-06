import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Easing, TextInput, Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated, ActivityIndicator } from 'react-native'
import FormattedText from '../../components/FormattedText'
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
  updateSearchResults } from './action'
import {updateExchangeRates} from '../../components/ExchangeRate/action'
import * as Animatable from 'react-native-animatable'
import Contacts from 'react-native-contacts'
import styles from './style'
import { border } from '../../../../util/border'

const monthNames = ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dev']
var dateStrings = []

class TransactionList extends Component {
   constructor(props) {
     super(props)
     this.state = {
       balance: 0
     }
   }
  
  componentWillMount() {
    this.props.dispatch(updateExchangeRates())         
    this.setState({
      balance: this.props.wallet.getBalance()
    })
  }
  
  componentDidMount() {
    /*Contacts.getAll((err, contacts) => {
      if(err && err.type === 'permissionDenied'){
      } else {
        this.props.dispatch(updateContactsList(contacts))
        var sampleTransactionsWithImages = []
        for(let v of this.props.transactionsList) {
          if(v.metaData.name){
            let presence = this.contactSearch(v.metaData.name, this.props.contactsList)
            if(presence && presence.hasThumbnail){
              var temporaryContact = {}
              Object.assign(temporaryContact, v)
              v.hasThumbnail = presence.hasThumbnail
              v.thumbnailPath = presence.thumbnailPath
              sampleTransactionsWithImages.push(v)
            } else {
              sampleTransactionsWithImages.push(v)
            }
          } else {
            sampleTransactionsWithImages.push(v)
          }
        }
        this.props.dispatch(updateTransactionsList(sampleTransactionsWithImages))
      }
    })*/
  }

  contactSearch (nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].givenName === nameKey) {
        return myArray[i]
      }
    }
  }

  _onSearchChange = () => {
    this.props.dispatch(updateSearchResults(null))
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

  onFocus = () => {

  }

  render () {
    console.log('the balance is: ', this.state.balance)
    var renderableTransactionList = this.props.transactions.sort(function (a, b) {
      a = new Date(a.date)
      b = new Date(b.date)
      return a > b ? -1 : a < b ? 1 : 0
    })
    var ds = new ListView.DataSource({ rowHasChanged: (row1, row2) => row1 !== row2 })
    var dataSource = ds.cloneWithRows(renderableTransactionList)
    // can also put dateIterator in here
    console.log('about to render transactionsList')
    return (
        <ScrollView style={[border('red'), styles.scrollView]} contentOffset={{x: 0,y: 44}}>     
          <SearchBar />
          <View style={[styles.container, border('green')]}>
            <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={[styles.currentBalanceBox, border('purple')]} colors={["#3b7adb","#2b569a"]}>
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
                  <View style={[styles.currentBalanceWrap, border('green')]}>
                    <View style={[styles.bitcoinIconWrap, border('yellow')]}>
                      <FAIcon style={[styles.bitcoinIcon]} name="bitcoin" color="white" size={24} />
                    </View>
                    <View style={[styles.currentBalanceBoxDollarsWrap, border('yellow')]}>
                      <FormattedText style={[styles.currentBalanceBoxDollars, border('purple')]}>$ {this.props.exchangeRates.USD ? (6000 * this.props.exchangeRates.TRD.value).toFixed(2) : ''}</FormattedText>
                    </View>
                    <View style={[styles.currentBalanceBoxBitsWrap, border('red')]}>
                      <FormattedText style={[styles.currentBalanceBoxBits, border('yellow')]}>b 600000</FormattedText>
                    </View>
                </View>  
                )}

              <View style={[styles.requestSendRow, border('yellow')]}>
                <TouchableHighlight style={[styles.requestBox, styles.button]}>
                  <View  style={[styles.requestWrap]}>
                    <FAIcon name="download" style={[styles.requestIcon]} color="#ffffff" size={24} />
                    <FormattedText style={[styles.request]}>Request</FormattedText>
                  </View>
                </TouchableHighlight>
                <TouchableHighlight onPress={() => Actions.scan()} style={[styles.sendBox, styles.button]}>
                  <View style={[styles.sendWrap]}>
                    <FAIcon name="upload" style={[styles.sendIcon]} color="#ffffff" size={24} onPress={() => Actions.scan()} />
                    <FormattedText style={styles.send}>Send</FormattedText>
                  </View>
                </TouchableHighlight>
              </View>
            </LinearGradient>

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

  renderTx = (tx) => {
    let txDate = new Date(tx.date * 1000)
    let month = txDate.getMonth()
    let day = txDate.getDate()
    let year = txDate.getFullYear()
    let dateString = monthNames[month] + ' ' + day + ', ' + year
    let sendReceiveSyntax, expenseIncomeSyntax, txColor
    dateStrings.push(dateString)
    if (tx.providerFee <= 0) {
      sendReceiveSyntax = 'Send'
      expenseIncomeSyntax = 'Expense'
      txColor = '#F03A47'
    } else {
      sendReceiveSyntax = 'Receive'
      expenseIncomeSyntax = 'Income'
      txColor = '#7FC343'
    }

    console.log('this.props is: ', this.props)

    return (
      <View style={styles.singleTransactionWrap}>
        {(dateStrings[tx.key + 1] !== dateStrings[tx.key]) &&
          (<View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <FormattedText style={styles.formattedDate}>{dateString}</FormattedText>
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
        <View style={[styles.singleTransaction, border('red')]}>
          <View style={[styles.transactionInfoWrap, border('yellow')]}>
            {tx.hasThumbnail ? (
              <Image style={[styles.transactionLogo, border('orange')]} source={{ uri: tx.thumbnailPath }} />
            ) : (
              <FAIcon name='user' style={[styles.transactionLogo, border('orange')]} size={50} />
            )}
            <View style={[styles.transactionDollars, border('blue')]}>
              <FormattedText style={[styles.transactionPartner, border('black')]}>Contact Name</FormattedText>
              <FormattedText style={[styles.transactionType, border('brown')]}>12:12 PM</FormattedText>
            </View>
            <View style={[styles.transactionBits, border('purple')]}>
              <FormattedText style={[styles.transactionDollarAmount, border('black'), {color: txColor} ]}>$ {(tx.amountSatoshi / 1000).toFixed(2)}</FormattedText>
              <FormattedText style={[styles.transactionBitAmount, border('brown')]}>{this.props.exchangeRates ? (tx.amountSatoshi * this.props.exchangeRates.TRD.value).toFixed(2) : ''}</FormattedText>
            </View>
          </View>
        </View>
      </View>
    )
  }
}

TransactionList.propTypes = {
  transactionsList: PropTypes.array,
  searchVisible: PropTypes.bool,
  contactsList: PropTypes.array
}

export default TransactionListConnect = connect ( state => ({
  // updatingBalance: state.ui.transactionList.updatingBalance,
  updatingBalance: false,
  transactions: state.ui.transactionList.transactions,
  searchVisible: state.ui.transactionList.searchVisible,
  contactsList: state.ui.transactionList.contactsList,
  exchangeRates: state.exchangeRate.exchangeRates,
  wallet: state.wallets.byId[state.ui.wallets.selectedWalletId]
}))(TransactionList)


class SearchBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      focused: false,
      animation: new Animated.Value(0),
      op: new Animated.Value(0)
    }
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
    let toOpacity, toWidth
    if(this.state.focused){
      toOpacity = 0
      toWidth = 0

      Animated.sequence([
        Animated.timing(
          this.state.op,
          {
            toValue: toOpacity,
            duration: 100
          }
        ),
        Animated.timing(
          this.state.animation,
          {
            toValue: toWidth,
            duration: 100
          }
        )        
      ]).start()      
    } else {
      toOpacity = 1
      toWidth = 60

      Animated.sequence([
        Animated.timing(
          this.state.animation,
          {
            toValue: toWidth,
            duration: 100
          }
        ),
        Animated.timing(
          this.state.op,
          {
            toValue: toOpacity,
            duration: 100
          }
        )
      ]).start()      
    }
  }

  _onCancel = () => {
    this.setState({
      width: 0
    })
  }

  render() {
    return(
      <View style={[styles.searchContainer, border('green')]}>
        <View style={[ styles.innerSearch, border('orange')]}>
          <EvilIcons name='search' style={[styles.searchIcon, border('purple')]} color='#9C9C9D' size={20} />
          <TextInput style={[styles.searchInput, border('yellow')]} onChangeText={this._onSearchChange} onBlur={this._onBlur} onFocus={this._onFocus} placeholder='Search' />
        </View>
          <Animated.View style={{width: this.state.animation, opacity: this.state.op}}>
            <TouchableHighlight onPress={this._onCancel} style={[border('red'), styles.cancelButton]}>
              <Text style={{color: 'white', backgroundColor: 'transparent'}}>Cancel</Text>
            </TouchableHighlight>
          </Animated.View>
      </View>     
    )
  }
}