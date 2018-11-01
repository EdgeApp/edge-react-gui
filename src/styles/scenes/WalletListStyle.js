// @flow

import { Platform, StyleSheet } from 'react-native'

import { scale, scaleH } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'

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
    paddingLeft: scale(12),
    paddingRight: scale(6),
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: scale(50)
  },
  walletsBoxHeaderTextWrap: {
    paddingVertical: scale(12)
  },
  leftArea: {
    flexDirection: 'row'
  },
  walletIcon: {
    width: scale(22),
    height: scale(22),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  walletsBoxHeaderText: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: scale(16)
  },
  donePlusContainer: {
    minWidth: scale(132),
    height: scale(50)
  },
  donePlusSortable: {
    alignItems: 'flex-end',
    marginRight: scale(30)
  },
  plusContainer: {
    position: 'absolute',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: scale(50),
    flexDirection: 'row'
  },
  fiatToggleWrap: {
    width: scale(92),
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
    paddingVertical: scale(12),
    width: scale(82)
  },
  toggleFiatText: {
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: scale(18),
    textAlign: 'center'
  },
  doneContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(50)
  },
  walletsBoxDoneTextWrap: {
    paddingVertical: scale(12)
  },
  walletsBoxDoneText: {
    fontSize: scale(18),
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
    padding: scale(12),
    borderBottomWidth: scale(1),
    borderColor: THEME.COLORS.GRAY_2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: scale(50)
  },
  archiveBoxHeaderTextWrap: {},
  archiveIcon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: scale(28)
  },
  archiveBoxHeaderText: {
    fontSize: scale(18),
    backgroundColor: THEME.COLORS.TRANSPARENT,
    color: THEME.COLORS.WHITE,
    marginLeft: scale(14)
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
    height: PLATFORM.usableHeight - scale(130) - scale(50)
  },
  sortableWalletListRow: {
    width: PLATFORM.deviceWidth,
    height: scale(70),
    backgroundColor: THEME.COLORS.WHITE,
    paddingVertical: scale(6),
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
    borderBottomWidth: scale(1),
    borderColor: THEME.COLORS.WHITE
  },
  fullList: {
    flex: 1,
    // position: 'absolute',
    height: PLATFORM.usableHeight - scale(130) - scale(50)
  },
  rowContainer: {
    padding: scale(6),
    paddingLeft: scale(8),
    height: scale(60),
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row'
  },
  sortableRowContent: {
    paddingRight: scale(32)
  },
  rowIconWrap: {
    justifyContent: 'center',
    width: scale(36)
  },
  rowNameTextWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: scale(5)
  },
  rowNameTextWrapAndroidIos: {
    flex: 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginRight: scale(5),
    flexDirection: 'row'
  },
  rowCurrencyLogoAndroid: {
    height: scale(22),
    width: scale(22),
    marginRight: scale(10),
    marginLeft: scale(5),
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  rowCurrencyLogoIOS: {
    height: scale(22),
    width: scale(26),
    resizeMode: 'contain',
    alignSelf: 'flex-start'
  },
  rowNameText: {
    fontSize: scale(18),
    color: THEME.COLORS.GRAY_1
  },
  rowBalanceTextWrap: {
    flex: 3,
    justifyContent: 'center'
  },
  rowBalanceText: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  rowBalanceAmountText: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_1,
    textAlign: 'right'
  },
  rowOptionsWrap: {
    width: scaleH(37)
  },
  rowBalanceDenominationText: {
    fontSize: scale(14),
    lineHeight: scale(18),
    color: THEME.COLORS.GRAY_1,
    textAlign: 'right'
  },
  rowDragArea: {
    justifyContent: 'center',
    marginRight: scale(20),
    marginLeft: scale(4)
  },
  rowDragIcon: {
    position: 'relative',
    top: scale(16)
  },
  rowMenuTrigger: {
    width: scale(46)
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
    marginRight: scale(13),
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
    borderBottomWidth: Platform.OS === 'ios' ? scale(1) : 0
  },
  nameInput: {
    height: Platform.OS === 'ios' ? scale(26) : scale(46),
    textAlign: 'center',
    fontSize: scale(20),
    color: THEME.COLORS.GRAY_1
  },
  emptyBottom: {
    flex: 1
  },
  subHeaderSyntax: {
    color: THEME.COLORS.GRAY_1,
    textAlign: 'center',
    fontSize: scale(14)
  },
  // buttons
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  stylizedButton: {
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 3
  },
  stylizedButtonTextWrap: {},
  stylizedButtonText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16)
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
    marginLeft: scale(4)
  },
  doneButton: {
    color: THEME.COLORS.PRIMARY
  },
  // beginning of token rows //
  tokenRowContainer: {
    padding: scale(6),
    paddingLeft: scale(8),
    height: scale(50),
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
    fontSize: scale(16),
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
    height: scale(50),
    backgroundColor: THEME.COLORS.WHITE,
    padding: scale(16),
    paddingLeft: scale(20),
    paddingRight: scale(20),
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
    height: scale(3),
    backgroundColor: '#E9E9EF'
  }
}

export default StyleSheet.create(styles)
