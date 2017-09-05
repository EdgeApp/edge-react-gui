import { StyleSheet } from 'react-native'
import {colors as c} from '../../../../theme/variables/airbitz'

export default StyleSheet.create({

  container: {
    flex: 1,
    alignItems: 'stretch'
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
    flex: 1,
    justifyContent: 'center'
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
  currentBalanceWrap: { // one
    flex: 3,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  balanceShownContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconWrap: { // two
    flex: 3,
    justifyContent: 'flex-start',
    backgroundColor: 'transparent'
  },
  currentBalanceBoxBitssWrap: { // two
    flex: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  currentBalanceBoxBits: {
    color: 'white',
    fontSize: 40
  },
  currentBalanceBoxDollarsWrap: {
    justifyContent: 'flex-start',
    flex: 4,
    paddingTop: 4
  },
  currentBalanceBoxDollars: { // two
    color: 'white',
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
  requestSendRow: { // two
    height: 50,
    flexDirection: 'row'
  },
  button: {
    borderRadius: 3
  },
  requestBox: {
    backgroundColor: 'rgba(37,69,123, .3)',
    opacity: 0.9,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 1,
    flexDirection: 'row'
  },
  requestWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  requestIcon: {
    textAlignVertical: 'center',
    alignSelf: 'center',
    marginRight: 10
  },
  sendBox: {
    backgroundColor: 'rgba(37,69,123, .3)',
    opacity: 0.9,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 1,
    marginRight: 8,
    flexDirection: 'row'
  },
  sendWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendIcon: {
    textAlignVertical: 'center',
    alignSelf: 'center',
    marginRight: 10
  },
  request: {
    fontSize: 18,
    color: 'white',
    marginHorizontal: 12
  },
  send: {
    fontSize: 18,
    color: 'white',
    marginHorizontal: 12
  },

  // beginning of second half
  transactionsWrap: {
    flex: 1
  },

  searchBarView: {
    paddingLeft: 12,
    paddingRight: 24,
    flexDirection: 'row',
    alignItems: 'center'
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
    borderBottomColor: c.gray3,
    padding: 10,
    paddingRight: 30,
    paddingLeft: 3,
    marginLeft: 15
  },
  singleTransactionWrap: {
    flexDirection: 'column',
    flex: 1
  },
  bottomDivider: {
    
  },
  singleDateArea: {
    backgroundColor: c.gray4,
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
    color: c.gray2,
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
    flexDirection: 'row',
    height: 40,
    flex: 1,
    justifyContent: 'space-between'
  },
  transactionLeft: {
    flexDirection: 'row'
  },
  transactionLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  transactionLeftTextWrap: {
    justifyContent: 'center'
  },
  transactionPartner: {
    fontSize: 16,
    color: c.gray1,
    textAlignVertical: 'center'
  },
  transactionBitAmount: {
    fontSize: 16,
    textAlignVertical: 'center'
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  transactionTime: {
    fontSize: 12,
    color: c.gray1,
    textAlignVertical: 'bottom',
    position: 'relative',
    top: 4
  },
  transactionDollarAmount: {
    fontSize: 12,
    color: c.gray2,
    textAlignVertical: 'center',
    position: 'relative',
    top: 4
  },
  accentGreen: {
    color: c.accentGreen
  },
  accentRed: {
    color: c.accentRed
  }
})
