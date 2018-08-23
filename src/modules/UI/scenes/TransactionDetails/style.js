// @flow

import { Platform, StyleSheet } from 'react-native'

import { isIphoneX } from '../../../../lib/isIphoneX.js'
import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform.js'

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
    height: 32,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  headerGradient: {
    height: 66,
    width: '100%',
    position: 'absolute'
  },
  modalHeaderIconWrapBottom: {
    borderRadius: 24,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    height: 48,
    width: 48,
    position: 'relative',
    top: 10
  },
  dataArea: {
    position: 'relative',
    top: 34,
    flexDirection: 'column'
  },
  payeeNameArea: {
    alignItems: 'center',
    flexDirection: 'column'
  },
  payeeNameWrap: {
    width: '80%',
    padding: 4,
    alignItems: 'center'
  },
  payeeNameInput: {
    color: THEME.COLORS.GRAY_1,
    fontSize: 17,
    height: Platform.OS === 'ios' ? 24 : 33,
    textAlign: 'center',
    width: '100%',
    fontFamily: THEME.FONTS.DEFAULT
  },
  payeeSeperator: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    width: '38%',
    height: 1,
    alignSelf: 'center'
  },
  dateWrap: {
    padding: 4,
    alignItems: 'center',
    flexDirection: 'column'
  },
  date: {
    color: THEME.COLORS.GRAY_2,
    fontSize: 14
  },
  amountAreaContainer: {
    flexDirection: 'column'
  },
  amountAreaCryptoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 20,
    paddingLeft: 15,
    paddingRight: 15
  },
  amountAreaLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  amountAreaLeftText: {
    fontSize: 14
  },
  amountAreaMiddle: {
    paddingTop: 10,
    flex: 3,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center'
  },
  amountAreaMiddleTop: {
    paddingBottom: 4
  },
  amountAreaMiddleTopText: {
    fontSize: 26,
    color: THEME.COLORS.GRAY_1
  },
  amountAreaMiddleBottom: {},
  amountAreaMiddleBottomText: {
    fontSize: 14,
    color: THEME.COLORS.GRAY_2
  },
  amountAreaRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  amountAreaRightText: {
    color: THEME.COLORS.GRAY_2,
    fontSize: 14
  },
  editableFiatRow: {
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15
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
    fontSize: 17,
    textAlign: 'center',
    height: PLATFORM.OS === 'ios' ? 26 : 34,
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
    fontSize: 14
  },
  categoryRow: {
    paddingTop: 15,
    marginTop: 10,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
    height: 44
  },
  modalCategoryRow: {
    paddingTop: 8,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
    height: 38
  },
  categoryLeft: {
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 4,
    paddingBottom: 6,
    height: 29
  },
  categoryLeftText: {
    fontSize: 15
  },
  categoryInputArea: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    marginLeft: 11,
    height: 27,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexDirection: 'row'
  },
  modalCategoryInputArea: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    marginLeft: 11,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexDirection: 'row'
  },
  categoryInput: {
    paddingTop: 4,
    height: PLATFORM.OS === 'ios' ? 22 : 26,
    fontSize: 13,
    flex: 1,
    color: THEME.COLORS.GRAY_1,
    fontFamily: THEME.FONTS.DEFAULT
  },
  notesRow: {
    paddingBottom: 20,
    paddingTop: 14,
    paddingLeft: 15,
    paddingRight: 15
  },
  notesInputWrap: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 3,
    height: PLATFORM.deviceHeight * 0.13 - (PLATFORM.platform === 'android' ? 23 : 0) + (isIphoneX ? 60 : 0),
    padding: 3
  },
  notesInput: {
    color: THEME.COLORS.GRAY_2,
    fontSize: 15,
    fontFamily: THEME.FONTS.DEFAULT,
    paddingVertical: 0
  },
  footerArea: {
    backgroundColor: THEME.COLORS.GRAY_4,
    paddingTop: 20,
    height: (PLATFORM.deviceHeight * 1) / 3 + 40,
    paddingLeft: 15,
    paddingRight: 15
  },
  buttonArea: {
    height: 50
  },
  saveButton: {
    height: 50
  },
  advancedTxArea: {
    padding: 12,
    paddingBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50
  },
  advancedTxText: {
    color: THEME.COLORS.SECONDARY,
    fontSize: 14,
    paddingTop: 12,
    paddingBottom: 12,
    alignSelf: 'center'
  },

  // subcategory selector
  subCategoryContainer: {
    paddingLeft: 15,
    paddingRight: 15,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.GRAY_3
  },
  rowContainer: {
    flex: 1,
    height: 50,
    paddingLeft: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: 1,
    borderColor: '#EEE'
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: 20
  },
  rowCategoryTextWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 5
  },
  rowCategoryText: {
    fontSize: 18,
    color: '#58595C'
  },
  rowPlusWrap: {
    justifyContent: 'center'
  },
  rowPlus: {
    fontSize: 16,
    color: '#58595C'
  },

  // beginning of contact search results
  searchResults: {
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  singleContact: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D6D6',
    padding: 10,
    paddingRight: 15,
    paddingLeft: 15
  },
  singleContactWrap: {
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
  contactInfoWrap: {
    flexDirection: 'row',
    height: 40,
    flex: 1,
    justifyContent: 'space-between'
  },
  contactLeft: {
    flexDirection: 'row'
  },
  contactLogo: {
    width: 40,
    height: 40,
    marginRight: 10
  },
  contactLeftTextWrap: {
    justifyContent: 'center'
  },
  contactName: {
    fontSize: 16,
    color: '#58595C',
    textAlignVertical: 'center'
  },
  contactBitAmount: {
    fontSize: 16,
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
    height: 44,
    justifyContent: 'center'
  },
  blockExplorerButtonText: {
    fontSize: 18,
    color: THEME.COLORS.ACCENT_BLUE,
    alignSelf: 'center'
  }
}

export default StyleSheet.create(styles)
