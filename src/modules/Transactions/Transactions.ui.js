import React, { Component } from 'react'
import { Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated }  from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base';
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import * as Animatable from 'react-native-animatable'
import Contacts from 'react-native-contacts'

const monthNames = ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dev']
var dateStrings = []
var dateIterator = -1

class Transactions extends Component {

  constructor(props) {
    console.log('in transactions constructor')
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
    ].sort(function(a, b) {
        a = new Date(a.date);
        b = new Date(b.date);
        return a>b ? -1 : a<b ? 1 : 0;
    });
    var ds = new ListView.DataSource({ rowHasChanged: (row1, row2) => row1 !== row2 })
    this.state =  {
      dataSource:  ds.cloneWithRows(sampleTransaction),
      searchVisible: false
    }
    this.state.sampleTransaction = sampleTransaction
  }

  componentWillMount() {
    Contacts.getAll((err, contacts) => {
      if(err && err.type === 'permissionDenied'){
        console.log('error in getting contacts: ', err)
      } else {
        console.log('returning all contacts, they are: ', contacts)
        this.state.contacts = contacts
        var sampleTransactionsWithImages = []
        for(let v of this.state.sampleTransaction) {
          if(v.metaData.name){
            console.log('inside for loop, this.state.contacts is: ')
            console.log(this.state.contacts)
            let presence = this.contactSearch(v.metaData.name, this.state.contacts)
            console.log(v.metaData.name , ' exists in a transaction')
            if(presence && presence.hasThumbnail){
              console.log(v.metaData.name , ' also has a thumbnail in contacts')
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
        //console.log('done with for loop, sampleTransactionsWithImages is: ', sampleTransactionsWithImages)
      }
        console.log('done with for loop, sampleTransactionsWithImages is: ', sampleTransactionsWithImages)
    })

    /*this.state.contactNamesWithImages = this.state.contacts.map(function(ctct) {
      if(ctct.hasThumbnail) {
        return ctct.givenName
      }
    })*/



    //console.log('sampleTransactionsWithImages: ', sampleTransactionsWithImages)

    /*const sampleTransactionsWithImages = sampleTransaction.map(function(tx) {
      if(tx.metaData.name && this.state.contactNamesWithImages.includes(tx.metaData.name)) {
        return{tx, imageUri: this.state.contactNamesWithImage}
      } else {
        return tx
      }
    })*/
  }

  contactSearch(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
      if (myArray[i].givenName === nameKey) {
        return myArray[i];
      }
    }
  }

  _onPressSearch (event) {
    this.setState({searchVisible: true})
  }

  _onSearchExit(event) {
    this.setState({searchVisible: false})
  }

  render () {
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
            {this.state.searchVisible &&
              <View style={[styles.searchBarView]} >
                <FAIcon size={14} name="search" style={styles.searchBarMagnifyingGlass} />
                <Input placeholder="Search" />
                <TouchableHighlight style={styles.searchBarCloseWrap} onPress={this._onSearchExit.bind(this)}>
                  <FAIcon name="close" size={14} style={[styles.searchBarClose]} color="#cccccc" />
                </TouchableHighlight>
              </View>
            }
              <ListView style={[styles.transactionsScrollWrap]} dataSource={this.state.dataSource} renderRow={this.renderTx.bind(this)} />
          </View>
        </View>
    )
  }



  renderTx(tx) {
    dateIterator++
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
    console.log('this tx.hasThumbnail is: ', tx.hasThumbnail, ', tx.thumbnailPath is: ', tx.thumbnailPath, ' tx is: ', tx)
    return (
      <View style={styles.singleTransactionWrap}>
      {(dateStrings[dateIterator] !== dateStrings[dateIterator - 1]) &&
          (<View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <Text style={styles.formattedDate}>{dateString}</Text>
            </View>
            {(dateIterator === 0) && (
              <View style={styles.rightDateSearch}>
                {!this.state.searchVisible &&
                    <TouchableHighlight style={styles.firstDateSearchWrap} onPress={this._onPressSearch.bind(this)}>
                      <FAIcon name="search" size={16} style={styles.firstDateSearchIcon} color="#cccccc" />
                    </TouchableHighlight>
                }
              </View>)}
          </View>)
        }
        <View style={styles.singleTransaction}>
          <View style={styles.transactionInfoWrap}>
            <Image style={styles.transactionLogo} source={{uri: tx.hasThumbnail ? tx.thumbnailPath : "https://www.shareicon.net/data/128x128/2015/09/01/94011_starbucks_512x512.png"}} />
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

export default connect()(Transactions)



const styles = StyleSheet.create({

  container: {
      flex: 1,
      alignItems: 'stretch',
  },
  currentBalanceBox: {
    flex: 5,
    justifyContent: "center"
  },
  currentBalanceWrap: {
    flex: 3,
    alignItems: 'center'
  },
  bitcoinIconWrap: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  currentBalanceBoxDollarsWrap: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  currentBalanceBoxDollars: {
    color: "#FFFFFF",
    fontSize: 36
  },
  currentBalanceBoxBits: {
    color: "#FFFFFF",
    justifyContent: "space-around",
    flex: 1
  },
  requestSendRow: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: 10
  },
  requestBox: {
    backgroundColor: 'rgba(37,69,123, .3)',
    opacity: .9,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 3,
    flexDirection: "row"
  },
  requestWrap: {
    flexDirection: 'row'
  },
  requestIcon: {
    marginRight: 10
  },
  sendBox: {
    backgroundColor: 'rgba(37,69,123, .3)',
    opacity: .9,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 3,
    marginRight: 10,
    flexDirection: "row"
  },
  sendWrap: {
    flexDirection: 'row'
  },
  sendIcon: {
    marginRight: 10
  },
  request: {
    color: "#ffffff",
  },
  send: {
    color: "#ffffff"
  },

  // beginning of second half
  transactionsWrap: {
    flex: 7
  },


  searchBarView: {
    paddingLeft: 12,
    paddingRight: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarMagnifyingGlass: {

  },
  searchBarInput: {

  },
  searchBarCloseWrap: {

  },
  searchBarClose: {

  },
  searchInputWrap: {

  },


  transactionsScrollWrap: {
    flex: 1
  },
  singleTransaction: {
    flex: 4
  },
  singleTransactionWrap: {
    flexDirection: 'column',
    flex: 1
  },
  singleDateArea: {
    backgroundColor: '#f6f6f6',
    flex: 3,
    padding: 8,
    flexDirection: 'row',
    paddingRight: 24
  },
  leftDateArea: {
    flex: 1
  },
  formattedDate: {
    color: "#cccccc",
    fontSize: 12
  },
  firstDateSearchIcon: {

  },
  singleTransaction: {
    padding: 12,
    paddingRight: 30
  },
  transactionInfoWrap: {
    flexDirection: "row"
  },
  transactionLogo: {
    flex: 1,
    marginRight: 10
  },
  transactionDollars: {
    flex: 3
  },
  transactionPartner: {
    fontSize: 16,
    color: "#000000"
  },
  transactionDollarAmount: {
    fontSize: 16,
    color: "#000000"
  },
  transactionBits: {
    flex: 2,
    alignItems: 'flex-end'
  },
  transactionType: {
    fontSize: 10,
    color: "#9b9b9b"
  },
  transactionBitAmount: {
    fontSize: 10,
    color: "#9b9b9b"
  }

});
