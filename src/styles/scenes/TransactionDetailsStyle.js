// @flow

import { Platform, StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'

export const activeOpacity = THEME.OPACITY.ACTIVE

export const styles = {
  container: {
    flex: 1,
    alignItems: 'stretch',
    flexDirection: 'column',
    zIndex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  expandedHeader: {
    height: scale(32),
    flexDirection: 'row',
    justifyContent: 'center'
  },
  headerGradient: {
    height: scale(66),
    width: '100%',
    position: 'absolute'
  },
  modalHeaderIconWrapBottom: {
    borderRadius: 24,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    height: scale(48),
    width: scale(48),
    position: 'relative',
    top: scale(10)
  },
  dataArea: {
    position: 'relative',
    top: scale(20),
    flexDirection: 'column'
  },
  payeeNameArea: {
    alignItems: 'center',
    flexDirection: 'column'
  },
  payeeNameWrap: {
    width: '80%',
    padding: scale(4),
    alignItems: 'center'
  },
  payeeNameInput: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(17),
    height: Platform.OS === 'ios' ? scale(24) : scale(33),
    textAlign: 'center',
    width: '100%',
    fontFamily: THEME.FONTS.DEFAULT
  },
  payeeSeperator: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    width: '38%',
    height: scale(1),
    alignSelf: 'center'
  },
  dateWrap: {
    padding: scale(4),
    alignItems: 'center',
    flexDirection: 'column'
  },
  date: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  },
  amountAreaContainer: {
    flexDirection: 'column'
  },
  amountAreaCryptoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: scale(10),
    paddingBottom: scale(10),
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  amountAreaLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  amountAreaLeftText: {
    fontSize: scale(14)
  },
  amountAreaMiddle: {
    paddingTop: scale(10),
    flex: 3,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center'
  },
  amountAreaMiddleTop: {
    paddingBottom: scale(4)
  },
  amountAreaMiddleTopText: {
    fontSize: scale(26),
    color: THEME.COLORS.GRAY_1
  },
  amountAreaMiddleBottom: {},
  amountAreaMiddleBottomText: {
    fontSize: scale(14),
    color: THEME.COLORS.GRAY_2
  },
  amountAreaRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  amountAreaRightText: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  },
  editableFiatRow: {
    flexDirection: 'row',
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  editableFiatLeft: {
    flex: 1
  },
  editableFiatArea: {
    width: '38%',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  fiatSymbol: {
    color: THEME.COLORS.GRAY_2
  },
  editableFiat: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(17),
    textAlign: 'center',
    height: PLATFORM.OS === 'ios' ? scale(26) : scale(34),
    flex: 1,
    fontFamily: THEME.FONTS.DEFAULT
  },
  editableFiatRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  editableFiatRightText: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  },
  categoryRow: {
    paddingTop: scale(15),
    marginTop: scale(10),
    flexDirection: 'row',
    paddingLeft: scale(15),
    paddingRight: scale(15),
    height: scale(44)
  },
  modalCategoryRow: {
    paddingTop: scale(8),
    flexDirection: 'row',
    paddingLeft: scale(15),
    paddingRight: scale(15),
    height: scale(38)
  },
  categoryLeft: {
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: scale(5),
    paddingRight: scale(5),
    paddingTop: scale(4),
    paddingBottom: scale(6),
    height: scale(29)
  },
  categoryLeftText: {
    fontSize: scale(15)
  },
  categoryInputArea: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    marginLeft: scale(11),
    height: scale(27),
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexDirection: 'row'
  },
  modalCategoryInputArea: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    marginLeft: scale(11),
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexDirection: 'row'
  },
  categoryInput: {
    paddingTop: scale(4),
    height: PLATFORM.OS === 'ios' ? scale(22) : scale(26),
    fontSize: scale(13),
    flex: 1,
    color: THEME.COLORS.GRAY_1,
    fontFamily: THEME.FONTS.DEFAULT
  },
  notesRow: {
    paddingBottom: scale(20),
    paddingTop: scale(14),
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  notesInputWrap: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 3,
    height: PLATFORM.deviceHeight * 0.13 - (PLATFORM.platform === 'android' ? scale(20) : 0),
    padding: scale(3)
  },
  notesInput: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(15),
    fontFamily: THEME.FONTS.DEFAULT,
    paddingVertical: 0
  },
  footerArea: {
    backgroundColor: THEME.COLORS.GRAY_4,
    paddingTop: scale(20),
    height: (PLATFORM.deviceHeight * 1) / 3 + 40,
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  buttonArea: {
    height: scale(50)
  },
  saveButton: {
    height: scale(50)
  },
  advancedTxArea: {
    padding: scale(12),
    paddingBottom: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(50)
  },
  advancedTxText: {
    color: THEME.COLORS.SECONDARY,
    fontSize: scale(14),
    paddingTop: scale(12),
    paddingBottom: scale(12),
    alignSelf: 'center'
  },

  // subcategory selector
  subCategoryContainer: {
    paddingLeft: scale(15),
    paddingRight: scale(15),
    marginTop: scale(15),
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.GRAY_3
  },
  rowContainer: {
    flex: 1,
    height: scale(50),
    paddingLeft: scale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: 1,
    borderColor: '#EEE'
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: scale(20)
  },
  rowCategoryTextWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: scale(5)
  },
  rowCategoryText: {
    fontSize: scale(18),
    color: '#58595C'
  },
  rowPlusWrap: {
    justifyContent: 'center'
  },
  rowPlus: {
    fontSize: scale(16),
    color: '#58595C'
  },

  // beginning of contact search results
  searchResults: {
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  singleContact: {
    height: scale(60),
    borderBottomWidth: 1,
    borderBottomColor: '#D8D6D6',
    padding: scale(10),
    paddingRight: scale(15),
    paddingLeft: scale(15)
  },
  singleContactWrap: {
    flexDirection: 'column',
    flex: 1
  },
  singleDateArea: {
    backgroundColor: '#f6f6f6',
    flex: 3,
    padding: scale(8),
    paddingLeft: scale(15),
    flexDirection: 'row',
    paddingRight: scale(24)
  },
  leftDateArea: {
    flex: 1
  },
  contactInfoWrap: {
    flexDirection: 'row',
    height: scale(40),
    flex: 1,
    justifyContent: 'space-between'
  },
  contactLeft: {
    flexDirection: 'row'
  },
  contactLogo: {
    width: scale(40),
    height: scale(40),
    marginRight: scale(10)
  },
  contactLeftTextWrap: {
    justifyContent: 'center'
  },
  contactName: {
    fontSize: scale(16),
    color: '#58595C',
    textAlignVertical: 'center'
  },
  contactBitAmount: {
    fontSize: scale(16),
    color: '#000000',
    textAlignVertical: 'center'
  },

  typeExchange: {
    color: THEME.COLORS.ACCENT_ORANGE
  },
  typeExpense: {
    color: THEME.COLORS.ACCENT_RED
  },
  typeTransfer: {
    color: THEME.COLORS.PRIMARY
  },
  typeIncome: {
    color: THEME.COLORS.ACCENT_BLUE
  },
  underlayColor: {
    color: THEME.COLORS.GRAY_4
  },
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },
  txIDIcon: {
    color: THEME.COLORS.PRIMARY
  },
  blockExplorerButton: {
    borderWidth: 0,
    height: scale(44),
    justifyContent: 'center'
  },
  blockExplorerButtonText: {
    fontSize: scale(18),
    color: THEME.COLORS.ACCENT_BLUE,
    alignSelf: 'center'
  }
}

export default StyleSheet.create(styles)
