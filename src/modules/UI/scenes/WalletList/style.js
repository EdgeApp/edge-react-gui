// @flow

import { Platform, StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform.js'

export const styles = {
  gradient: {
    height: THEME.HEADER
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  // bottom major portion of screen
  walletsBox: {
    // one
    flex: 1
  },
  walletsBoxHeaderWrap: {
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50
  },
  walletsBoxHeaderTextWrap: {
    paddingVertical: 12
  },
  leftArea: {
    flexDirection: 'row'
  },
  walletIcon: {
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  walletsBoxHeaderText: {
    fontSize: 18,
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: 16
  },
  donePlusContainer: {
    minWidth: 132,
    height: 50
  },
  donePlusSortable: {
    alignItems: 'flex-end',
    marginRight: 30
  },
  plusContainer: {
    position: 'absolute',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    flexDirection: 'row'
  },
  fiatToggleWrap: {
    width: 92,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletsBoxHeaderAddWallet: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    height: '100%',
    paddingVertical: 12,
    width: 82
  },
  toggleFiatText: {
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 18,
    textAlign: 'center'
  },
  doneContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50
  },
  walletsBoxDoneTextWrap: {
    paddingVertical: 12
  },
  walletsBoxDoneText: {
    fontSize: 18,
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    top: 0,
    left: 0
  },
  dropdownIcon: {
    textAlignVertical: 'center',
    alignSelf: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  archiveBoxHeaderWrap: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.GRAY_2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50
  },
  archiveBoxHeaderTextWrap: {},
  archiveIcon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 28
  },
  archiveBoxHeaderText: {
    fontSize: 18,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    color: THEME.COLORS.WHITE,
    marginLeft: 14
  },
  archiveBoxHeaderDropdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sortableWalletListContainer: {
    flex: 1,
    width: '100%'
  },
  sortableWalletList: {
    flexDirection: 'column',
    alignContent: 'stretch'
  },
  listsContainer: {
    flex: 1
  },
  sortableList: {
    flex: 1,
    position: 'absolute',
    height: PLATFORM.usableHeight - 130 - 50
  },
  sortableWalletListRow: {
    width: PLATFORM.deviceWidth,
    height: 50,
    backgroundColor: THEME.COLORS.WHITE,
    paddingVertical: 6,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.WHITE
  },
  fullList: {
    flex: 1,
    // position: 'absolute',
    height: PLATFORM.usableHeight - 130 - 50
  },
  rowContainer: {
    padding: 6,
    paddingLeft: 16,
    flexDirection: 'column',
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row'
  },
  sortableRowContent: {
    paddingRight: 32
  },
  rowNameTextWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 5
  },
  rowNameTextWrapIOS: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 5
  },
  rowNameTextWrapAndroid: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginRight: 5,
    flexDirection: 'row'
  },
  rowCurrencyLogoAndroid: {
    height: 22,
    width: 22,
    marginRight: 5,
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  rowCurrencyLogoIOS: {
    height: 22,
    width: 26,
    resizeMode: 'contain',
    alignSelf: 'flex-start'
  },
  rowNameText: {
    fontSize: 18,
    color: THEME.COLORS.GRAY_1
  },
  rowBalanceTextWrap: {
    justifyContent: 'center',
    height: 38
  },
  rowBalanceText: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  rowBalanceAmountText: {
    fontSize: 16,
    color: THEME.COLORS.GRAY_1,
    textAlign: 'right'
  },
  rowBalanceDenominationText: {
    fontSize: 14,
    lineHeight: 18,
    color: THEME.COLORS.GRAY_1,
    textAlign: 'right'
  },

  rowDragArea: {
    justifyContent: 'center',
    marginRight: 20,
    marginLeft: 4
  },
  rowDragIcon: {
    position: 'relative',
    top: 16
  },
  rowMenuTrigger: {
    width: 46
  },

  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },
  // beginning of options component
  editIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center'
  },
  trashIcon: {
    marginRight: 13,
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center'
  },
  archive: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center'
  },
  nameInputWrap: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    marginTop: 0,
    marginBottom: 0,
    borderBottomColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: Platform.OS === 'ios' ? 1 : 0
  },
  nameInput: {
    height: Platform.OS === 'ios' ? 26 : 46,
    textAlign: 'center',
    fontSize: 20,
    color: THEME.COLORS.GRAY_1
  },
  emptyBottom: {
    flex: 1
  },
  subHeaderSyntax: {
    color: THEME.COLORS.GRAY_1,
    textAlign: 'center',
    fontSize: 14
  },
  // buttons
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  stylizedButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 3
  },
  stylizedButtonTextWrap: {},
  stylizedButtonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 16
  },
  cancelButtonWrap: {
    backgroundColor: THEME.COLORS.GRAY_2,
    alignSelf: 'flex-start'
  },
  cancelButton: {
    color: THEME.COLORS.SECONDARY
  },
  doneButtonWrap: {
    backgroundColor: THEME.COLORS.PRIMARY,
    alignSelf: 'flex-end',
    marginLeft: 4
  },
  doneButton: {
    color: THEME.COLORS.PRIMARY
  },
  // beginning of token rows //
  tokenRowContainer: {
    padding: 16,
    paddingLeft: 30,
    paddingRight: 44,
    backgroundColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.GRAY_3
  },
  tokenRowContent: {
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  tokenRowNameTextWrap: {
    justifyContent: 'center'
  },
  tokenRowText: {
    fontSize: 16,
    color: THEME.COLORS.GRAY_1
  },
  // end of token rows //,,

  activeOpacity: {
    opacity: THEME.OPACITY.ACTIVE
  },
  walletRowUnderlay: {
    color: THEME.COLORS.ROW_PRESSED
  },
  tokenRowUnderlay: {
    color: THEME.COLORS.ROW_PRESSED
  },
  emptyRow: {
    height: 50,
    backgroundColor: THEME.COLORS.WHITE,
    padding: 16,
    paddingLeft: 20,
    paddingRight: 20,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.GRAY_4
  },
  emptyRowUnderlay: {
    color: THEME.COLORS.ROW_PRESSED
  },
  getSeedModal: {
    top: PLATFORM.deviceHeight / 18
  },
  seedText: {
    textAlign: 'center'
  },
  copyButton: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    color: THEME.COLORS.SECONDARY
  },

  // beginning of wallet list progress dropdown //
  walletListProgressDropdown: {
    width: '100%',
    top: THEME.HEADER
  },
  walletListProgressDropdownTopText: {
    color: THEME.COLORS.WHITE
  },
  walletListProgressDropdownBottomText: {
    color: THEME.COLORS.WHITE
  },

  progressBarSpacer: {
    height: 3,
    backgroundColor: '#E9E9EF'
  }
}

export default StyleSheet.create(styles)
