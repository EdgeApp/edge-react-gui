// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'
import { scale } from '../../util/scaling.js'

export const styles = {
  // searchbar stuff
  searchContainer: {
    backgroundColor: THEME.COLORS.PRIMARY,
    height: scale(44),
    paddingTop: scale(8),
    paddingBottom: scale(8),
    paddingRight: scale(10),
    paddingLeft: scale(10),
    flexDirection: 'row'
  },
  innerSearch: {
    backgroundColor: THEME.COLORS.WHITE,
    height: scale(28),
    borderRadius: scale(3),
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: scale(8),
    paddingRight: scale(8)
  },
  searchIcon: {
    color: THEME.COLORS.GRAY_2
  },
  searchInput: {
    height: scale(18),
    flex: 1,
    alignSelf: 'center',
    textAlign: 'center'
  },
  cancelButton: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: scale(6),
    paddingRight: scale(6),
    height: scale(28)
  },
  cancelButtonText: {
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },

  // end of searchbar stuff
  touchableBalanceBox: {
    height: scale(200)
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
    fontSize: scale(44)
  },
  balanceBoxContents: {
    flex: 1,
    paddingTop: scale(10),
    paddingBottom: scale(20),
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
    height: scale(28),
    width: scale(28),
    justifyContent: 'flex-start',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxBitsWrap: {
    // two
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxBits: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(40)
  },
  currentBalanceBoxDollarsWrap: {
    justifyContent: 'flex-start',
    height: scale(26),
    paddingTop: scale(4),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxDollars: {
    // two
    color: THEME.COLORS.WHITE,
    fontSize: scale(20)
  },
  balanceHiddenContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  balanceHiddenText: {
    alignSelf: 'center',
    color: THEME.COLORS.WHITE,
    fontSize: scale(36)
  },
  requestSendRow: {
    // two
    height: scale(50),
    flexDirection: 'row'
  },
  button: {
    borderRadius: scale(3)
  },
  requestBox: {
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
    marginRight: scale(2),
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
    marginRight: scale(10)
  },
  sendBox: {
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    // opacity: THEME.OPACITY.MID,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(2),
    marginRight: scale(8),
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
    marginRight: scale(10)
  },
  request: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    marginHorizontal: scale(12)
  },
  send: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    marginHorizontal: scale(12)
  },

  // beginning of second half
  searchBarView: {
    paddingLeft: scale(12),
    paddingRight: scale(24),
    flexDirection: 'row',
    alignItems: 'center'
  },
  transactionsScrollWrap: {
    flex: 1
  },
  singleTransaction: {
    height: scale(80),
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    padding: scale(15),
    paddingRight: scale(15),
    paddingLeft: scale(15)
  },
  singleTransactionWrap: {
    backgroundColor: THEME.COLORS.WHITE,
    flexDirection: 'column',
    flex: 1
  },
  singleDateArea: {
    backgroundColor: THEME.COLORS.GRAY_4,
    flex: 3,
    padding: scale(3),
    paddingLeft: scale(15),
    flexDirection: 'row',
    paddingRight: scale(24)
  },
  leftDateArea: {
    flex: 1
  },
  formattedDate: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  },
  rightDateSearch: {
    flex: 1,
    alignItems: 'flex-end'
  },
  transactionInfoWrap: {
    flex: 1,
    flexDirection: 'row',
    height: scale(40)
  },
  transactionLeft: {
    flexDirection: 'row'
  },
  transactionLogo: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(10)
  },
  transactionLeftLogoWrap: {
    justifyContent: 'center'
  },
  transactionLeftTextWrap: {
    flex: 10,
    justifyContent: 'center'
  },
  transactionPartner: {
    flex: 1
  },
  transactionBitAmount: {
    fontSize: scale(16),
    textAlignVertical: 'center'
  },
  transactionRight: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  transactionTimePendingArea: {
    fontSize: scale(12),
    textAlignVertical: 'bottom',
    position: 'relative',
    top: scale(4)
  },
  transactionTime: {
    color: THEME.COLORS.SECONDARY
  },
  transactionPending: {
    color: THEME.COLORS.ACCENT_RED
  },
  transactionPartialConfirmation: {
    color: THEME.COLORS.ACCENT_ORANGE
  },
  transactionDollarAmount: {
    fontSize: scale(12),
    color: THEME.COLORS.GRAY_2,
    textAlignVertical: 'center',
    position: 'relative',
    top: scale(4)
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
    backgroundColor: THEME.COLORS.GRAY_4,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(230)
  },
  buyCryptoContainer: {
    backgroundColor: THEME.COLORS.GRAY_4,
    width: PLATFORM.deviceWidth,
    height: scale(220),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(15)
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
    width: scale(40),
    height: scale(40)
  },
  buyCryptoBoxText: {
    marginTop: scale(10),
    fontSize: scale(17),
    color: THEME.COLORS.GRAY_1
  },
  buyCryptoNoTransactionBox: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buyCryptoNoTransactionText: {
    fontSize: scale(17),
    color: THEME.COLORS.ACCENT_BLUE
  },
  transactionDetailsRow: {
    flexDirection: 'row',
    width: '100%'
  },
  transactionDetailsRowMargin: {
    marginBottom: scale(2)
  },
  transactionDetailsReceivedTx: {
    color: '#77C513'
  },
  transactionDetailsSentTx: {
    color: '#E85466'
  },
  transactionCategory: {
    flex: 1,
    fontSize: 12,
    color: THEME.COLORS.SECONDARY
  },
  transactionFiat: {
    fontSize: 12,
    color: THEME.COLORS.SECONDARY
  },
  transactionPendingTime: {
    flex: 1,
    fontSize: 12
  }
}

export default StyleSheet.create(styles)
