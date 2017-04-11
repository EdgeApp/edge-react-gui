import React, { Component } from 'react'
import { Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated }  from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base';
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import {transactionsSearchVisible, transactionsSearchHidden, deleteTransactionsList,updateTransactionsList, updateContactsList} from './Transactions.action'
import * as Animatable from 'react-native-animatable'
import Contacts from 'react-native-contacts'
import styles from './Transactions.style'


const monthNames = ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dev']
var dateStrings = []

class Transactions extends Component {

  constructor(props) {
    super(props)
    const sampleTransaction = [
      {
        "key": 1,
        "abcWalletTx": "345efgd435refd",
        "metaData": {
          "name": "Kylan Hurt"
        },
        "txid": "4345345345",
        "date": 1424338372,
        "blockHeight": 9999,
        "amountSatoshi": 2342343,
        "providerFee": 23424444,
        "networkFee": 11122333,
        "runningBalance": 44433211,
        "signedTx": [],
        "otherParams": {"test": true}
      },  {
        "key": 2,
        "abcWalletTx": "",
        "metaData": {
          "name": "Kylan"
        },
        "txid": "",
        "date": 1424338372,
        "blockHeight": 9999,
        "amountSatoshi": 2342343,
        "providerFee": 23424444,
        "networkFee": 11122333,
        "runningBalance": 44433211,
        "signedTx": [],
        "otherParams": {"test": true}
      },  {
        "key": 3,
        "abcWalletTx": "",
        "metaData": "",
        "txid": "",
        "date": 1191355372,
        "blockHeight": 234,
        "amountSatoshi": 2323443,
        "providerFee": 232224444,
        "networkFee": 1222333,
        "runningBalance": 4224211,
        "signedTx": [],
        "otherParams": {"test": true}
      },  {
        "key": 4,
        "abcWalletTx": "",
        "metaData": "",
        "txid": "",
        "date": 101338372,
        "blockHeight": 33399,
        "amountSatoshi": 23432343,
        "providerFee": 234424444,
        "networkFee": 87922333,
        "runningBalance": 44433211,
        "signedTx": [],
        "otherParams": {"test": true}
      },  {
        "key": 5,
        "abcWalletTx": "",
        "metaData": "",
        "txid": "",
        "date": 1091338372,
        "blockHeight": 888877,
        "amountSatoshi": 78942343,
        "providerFee": 789424444,
        "networkFee": 999922333,
        "runningBalance": 7877332,
        "signedTx": [],
        "otherParams": {"test": true}
      }
    ]
    this.props.dispatch(updateTransactionsList(sampleTransaction))
  }

  componentDidMount() {
    Contacts.getAll((err, contacts) => {
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
    })
  }

  contactSearch(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
      if (myArray[i].givenName === nameKey) {
        return myArray[i];
      }
    }
  }

  _onPressSearch (event) {
    this.props.dispatch(transactionsSearchVisible)
  }

  _onSearchExit(event) {
    this.props.dispatch(transactionsSearchHidden)
  }

  render () {
    var renderableTransactionList = this.props.transactionsList.sort(function(a, b) {
        a = new Date(a.date);
        b = new Date(b.date);
        return a>b ? -1 : a<b ? 1 : 0;
    });
    var ds = new ListView.DataSource({ rowHasChanged: (row1, row2) => row1 !== row2 })
    var dataSource =  ds.cloneWithRows(renderableTransactionList)
    //can also put dateIterator in here
    return (
        <View style={styles.container}>
          <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={styles.currentBalanceBox} colors={["#3b7adb","#2b569a"]}>
            <View style={[styles.currentBalanceWrap]}>
              <View style={[styles.bitcoinIconWrap]}>
                <FAIcon style={[styles.bitcoinIcon]} name="bitcoin" color="white" size={16} />
              </View>
              <View style={styles.currentBalanceBoxDollarsWrap}>
                <Text style={[styles.currentBalanceBoxDollars]}>$ 8,200.00</Text>
              </View>
              <Text style={[styles.currentBalanceBoxBits]}>b 6.4616</Text>
            </View>
            <View style={styles.requestSendRow}>
              <TouchableHighlight style={styles.requestBox}>
                <View  style={styles.requestWrap}>
                  <FAIcon name="download" style={[styles.requestIcon]}color="#ffffff" size={24} />
                  <Text style={[styles.request]}>Request</Text>
                </View>
              </TouchableHighlight>
              <TouchableHighlight onPress={() => Actions.send()} style={styles.sendBox}>
                <View style={styles.sendWrap}>
                  <FAIcon name="upload" style={styles.sendIcon} color="#ffffff" size={24} onPress={() => Actions.send()} />
                  <Text style={styles.send}>Send</Text>
                </View>
              </TouchableHighlight>
            </View>
          </LinearGradient>
          <View style={[styles.transactionsWrap]}>
            {this.props.searchVisible &&
              <View style={[styles.searchBarView]} >
                <FAIcon size={14} name="search" style={styles.searchBarMagnifyingGlass} />
                <Input placeholder="Search" />
                <TouchableHighlight style={styles.searchBarCloseWrap} onPress={this._onSearchExit.bind(this)}>
                  <FAIcon name="close" size={14} style={[styles.searchBarClose]} color="#cccccc" />
                </TouchableHighlight>
              </View>
            }
              <ListView style={[styles.transactionsScrollWrap]} dataSource={dataSource} renderRow={this.renderTx.bind(this)} />
          </View>
        </View>
    )
  }



  renderTx(tx) {
    let txDate = new Date(tx.date * 1000)
    let month = txDate.getMonth()
    let day = txDate.getDate()
    let year = txDate.getFullYear()
    let dateString = monthNames[month] + ' ' + day + ', ' + year
    dateStrings.push(dateString)
    if(tx.providerFee <= 0) {
      var sendReceiveSyntax = 'Send'
      var expenseIncomeSyntax = 'Expense'
    } else {
      var sendReceiveSyntax = 'Receive'
      var expenseIncomeSyntax = 'Income'
    }

    return (
      <View style={styles.singleTransactionWrap}>
      {(dateStrings[tx.key + 1] !== dateStrings[tx.key]) &&
          (<View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <Text style={styles.formattedDate}>{dateString}</Text>
            </View>
            {tx.key === 1 && (
            <View style={styles.rightDateSearch}>
            {(this.props.searchVisible === false) && (
                <TouchableHighlight style={styles.firstDateSearchWrap} onPress={this._onPressSearch.bind(this)}>
                  <FAIcon name="search" size={16} style={styles.firstDateSearchIcon} color="#cccccc" />
                </TouchableHighlight>
            )}
          </View>)}
        </View>)
        }
        <View style={styles.singleTransaction}>
          <View style={styles.transactionInfoWrap}>
              {tx.hasThumbnail ? (
                <Image style={styles.transactionLogo} source={{ uri: tx.thumbnailPath }} />
              ) : (
                <FAIcon name="user" style={styles.transactionLogo} size={50} />
              )}
            <View style={styles.transactionDollars}>
              <Text style={styles.transactionPartner}>{sendReceiveSyntax}</Text>
              <Text style={styles.transactionType}>{expenseIncomeSyntax}</Text>
            </View>
            <View style={styles.transactionBits}>
              <Text style={styles.transactionDollarAmount}>$ {(tx.amountSatoshi / 1000).toFixed(2)}</Text>
              <Text style={styles.transactionBitAmount}>{tx.amountSatoshi}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  border(color) {
    return {
      borderColor: color,
      borderWidth: 1
    }
  }
}

export default connect( state => ({

  transactionsList: state.transactions.transactionsList,
  searchVisible: state.transactions.searchVisible,
  contactsList: state.transactions.contactsList

}) )(Transactions)
