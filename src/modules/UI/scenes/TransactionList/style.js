import React from 'react-native'
import {StyleSheet} from 'react-native';

module.exports = StyleSheet.create({

  container: {
      flex: 1,
      alignItems: 'stretch',
  },

  // searchbar stuff

  scrollView: {
    flex: 1
  },
  searchContainer: {
    backgroundColor: '#1C4F98',
    height: 44,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 10,
    paddingLeft: 10,
    flexDirection: 'row'
  },
  innerSearch: {
    backgroundColor: 'white',
    height: 28,
    borderRadius: 3,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 8
  },
  searchIcon: {

  },
  searchInput: {
    height: 18,
    flex: 1,
    alignSelf: 'center',
    textAlign: 'center'        
  },
  cancelButton: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 6,
    height: 28
  },

  // end of searchbar stuff

  currentBalanceBox: {
    flex:1,  
    justifyContent: "center" 
  },
  updatingBalanceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    flex: 1
  },
  updatingBalance: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  currentBalanceWrap: { //one
    flex: 3,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  balanceShownContainer: {
    justifyContent: 'center', 
    alignItems: 'center'    
  },
  bitcoinIconWrap: { //two
    flex: 3,
    justifyContent: 'flex-start',
    backgroundColor: 'transparent'
  },
  currentBalanceBoxDollarsWrap: { //two
    flex: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  currentBalanceBoxDollars: {
    color: "#FFFFFF",
    fontSize: 40
  },
  currentBalanceBoxBitsWrap: {
    justifyContent: "flex-start",
    flex: 4,    
    paddingTop: 4
  },
  currentBalanceBoxBits: { //two
    color: "#FFFFFF",
    fontSize: 20
  },
  balanceHiddenContainer: {
    justifyContent: 'center', 
    alignItems: 'center', 
    flex: 1    
  },
  balanceHiddenText: {
    alignSelf: 'center', 
    color: 'white',
    fontSize: 36
  },
  requestSendRow: { //two
    flex: 1,
    flexDirection: 'row'
  },
  button: {
    borderRadius: 3
  },
  requestBox: {
    backgroundColor: 'rgba(37,69,123, .3)',
    opacity: .9,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 1,
    flexDirection: "row"
  },
  requestWrap: {
    flexDirection: 'row'
  },
  requestIcon: {
    textAlignVertical: 'center',
    alignSelf: 'center',
    marginRight: 10
  },
  sendBox: {
    backgroundColor: 'rgba(37,69,123, .3)',
    opacity: .9,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 1,
    marginRight: 8,
    flexDirection: "row"
  },
  sendWrap: {
    flexDirection: 'row'
  },
  sendIcon: {
    textAlignVertical: 'center',
    alignSelf: 'center',    
    marginRight: 10
  },
  request: {
    fontSize: 18,
    color: "#ffffff",
  },
  send: {
    fontSize: 18,
    color: "#ffffff"
  },

  // beginning of second half
  transactionsWrap: {
    flex: 1
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
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D6D6',
    padding: 10,
    paddingRight: 30,
    paddingLeft: 3,
    marginLeft: 15,    
  },
  singleTransactionWrap: {
    flexDirection: 'column',
    flex: 1
  },
  singleDateArea: {
    backgroundColor: '#f6f6f6',
    flex: 3,
    padding: 8,
    paddingLeft: 15,
    flexDirection: 'row',
    paddingRight: 24
  },
  leftDateArea: {
    flex: 1
  },
  formattedDate: {
    color: "#909091",
    fontSize: 14
  },
  rightDateSearch: {
    flex: 1,
    alignItems: 'flex-end'
  },
  firstDateSearchWrap: {

  },
  firstDateSearchIcon: {

  },
  transactionInfoWrap: {
    flexDirection: "row",
    height: 40
  },
  transactionLogo: {
    width: 40,
    height: 40,
    marginRight: 10
  },
  transactionDollars: {
    flex: 3,
    justifyContent: 'center',
  },
  transactionPartner: {
    fontSize: 14,
    color: "#58595C",
    textAlignVertical: 'center'    
  },
  transactionBitAmount: {
    fontSize: 14,
    color: "#000000",
    textAlignVertical: 'center'    
  },
  transactionBits: {
    flex: 2,
    alignItems: 'flex-end',
    justifyContent: 'center'    
  },
  transactionTime: {
    fontSize: 10,
    color: "#58595C",
    textAlignVertical: 'bottom',
    position: 'relative',
    top: 4
  },
  transactionDollarAmount: {
    fontSize: 10,
    color: "#909091",
    textAlignVertical: 'center',
    position: 'relative',
    top: 4
  }

});