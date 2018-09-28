// @flow

import { StyleSheet } from 'react-native'
import ExtraDimensions from 'react-native-extra-dimensions-android'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform.js'

const SOFT_MENU_BAR_HEIGHT = ExtraDimensions.get('SOFT_MENU_BAR_HEIGHT')

export const styles = {
  gradient: {
    height: THEME.HEADER
  },
  scene: {
    width: '100%',
    height: PLATFORM.usableHeight + PLATFORM.toolbarHeight
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },

  // searchbar stuff

  scrollView: {
    flex: 1
  },
  searchContainer: {
    backgroundColor: THEME.COLORS.PRIMARY,
    height: 44,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 10,
    paddingLeft: 10,
    flexDirection: 'row'
  },
  innerSearch: {
    backgroundColor: THEME.COLORS.WHITE,
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
    color: THEME.COLORS.GRAY_2
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
  cancelButtonText: {
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },

  // end of searchbar stuff
  touchableBalanceBox: {
    height: 200
  },
  currentBalanceBox: {
    flex: 1,
    justifyContent: 'center'
  },
  totalBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  hiddenBalanceBoxDollarsWrap: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxHiddenText: {
    color: THEME.COLORS.WHITE,
    fontSize: 44
  },
  balanceBoxContents: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: 'space-between'
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
    // one
    flex: 3,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  balanceShownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  },
  iconWrap: {
    // two
    height: 28,
    width: 28,
    justifyContent: 'flex-start',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxBitsWrap: {
    // two
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxBits: {
    color: THEME.COLORS.WHITE,
    fontSize: 40
  },
  currentBalanceBoxDollarsWrap: {
    justifyContent: 'flex-start',
    height: 26,
    paddingTop: 4,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxDollars: {
    // two
    color: THEME.COLORS.WHITE,
    fontSize: 20
  },
  balanceHiddenContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  balanceHiddenText: {
    alignSelf: 'center',
    color: THEME.COLORS.WHITE,
    fontSize: 36
  },
  requestSendRow: {
    // two
    height: 50,
    flexDirection: 'row'
  },
  button: {
    borderRadius: 3
  },
  requestBox: {
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 2,
    flexDirection: 'row',
    borderColor: THEME.COLORS.GRAY_4
    // borderWidth: 0.1,
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
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    // opacity: THEME.OPACITY.MID,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    marginRight: 8,
    flexDirection: 'row',
    borderColor: THEME.COLORS.GRAY_4
    // borderWidth: 0.1,
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
    color: THEME.COLORS.WHITE,
    marginHorizontal: 12
  },
  send: {
    fontSize: 18,
    color: THEME.COLORS.WHITE,
    marginHorizontal: 12
  },

  // beginning of second half
  transactionsWrap: {
    flex: 1
  },
  androidTransactionsWrap: {
    height: PLATFORM.usableHeight - SOFT_MENU_BAR_HEIGHT + THEME.HEADER
  },
  searchBarView: {
    paddingLeft: 12,
    paddingRight: 24,
    flexDirection: 'row',
    alignItems: 'center'
  },
  transactionsScrollWrap: {
    flex: 1,
    backgroundColor: THEME.COLORS.OFF_WHITE
  },
  singleTransaction: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    padding: 10,
    paddingRight: 30,
    paddingLeft: 15
  },
  singleTransactionWrap: {
    backgroundColor: THEME.COLORS.WHITE,
    flexDirection: 'column',
    flex: 1
  },
  singleDateArea: {
    backgroundColor: THEME.COLORS.GRAY_4,
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
    color: THEME.COLORS.GRAY_2,
    fontSize: 14
  },
  rightDateSearch: {
    flex: 1,
    alignItems: 'flex-end'
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
    color: THEME.COLORS.GRAY_1,
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
  transactionTimePendingArea: {
    fontSize: 12,
    textAlignVertical: 'bottom',
    position: 'relative',
    top: 4
  },
  transactionTime: {
    color: THEME.COLORS.GRAY_1
  },
  transactionPending: {
    color: THEME.COLORS.ACCENT_RED
  },
  transactionPartialConfirmation: {
    color: THEME.COLORS.ACCENT_ORANGE
  },
  transactionDollarAmount: {
    fontSize: 12,
    color: THEME.COLORS.GRAY_2,
    textAlignVertical: 'center',
    position: 'relative',
    top: 4
  },
  accentGreen: {
    color: THEME.COLORS.ACCENT_BLUE
  },
  accentRed: {
    color: THEME.COLORS.ACCENT_RED
  },
  underlay: {
    color: THEME.COLORS.SECONDARY
  },
  transactionUnderlay: {
    color: THEME.COLORS.ROW_PRESSED
  },
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },
  emptyListLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 230
  },
  buyCryptoContainer: {
    width: PLATFORM.deviceWidth,
    height: 220,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15
  },
  buyCryptoBox: {
    flex: 2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  buyCryptoBoxImage: {
    width: 40,
    height: 40
  },
  buyCryptoBoxText: {
    marginTop: 10,
    fontSize: 17,
    color: THEME.COLORS.GRAY_1
  },
  buyCryptoNoTransactionBox: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buyCryptoNoTransactionText: {
    fontSize: 17,
    color: THEME.COLORS.ACCENT_BLUE
  }
}

export default StyleSheet.create(styles)
