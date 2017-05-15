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
  currentBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  bitcoinIconWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  currentBalanceBoxDollarsWrap: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
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
