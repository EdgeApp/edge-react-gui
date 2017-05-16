import React from 'react-native'
import {StyleSheet} from 'react-native';

module.exports = StyleSheet.create({

  container: {
      flex: 1,
      alignItems: 'stretch',
  },
  currentBalanceBox: {
    flex: 5,
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 20,    
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
  bitcoinIconWrap: { //two
    flex: 4,
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
  rightDateSearch: {
    flex: 1,
    alignItems: 'flex-end'
  },
  firstDateSearchWrap: {

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
