// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'

export const styles = {
  gradient: {
    height: THEME.HEADER
  },
  content: {
    backgroundColor: THEME.COLORS.WHITE,
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(5)
  },
  container: {
    position: 'relative',
    height: '100%',
    backgroundColor: THEME.COLORS.GRAY_4
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: 20,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT,
    marginLeft: 8
  },
  instructionArea: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
    backgroundColor: THEME.COLORS.GRAY_4
  },
  instructionText: {
    textAlign: 'center',
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_1
  },
  listStyle: {
    height: scale(100)
  },
  unlockRow: {
    padding: scale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: scale(50)
  },
  leftArea: {
    flexDirection: 'row'
  },
  icon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: scale(22),
    color: THEME.COLORS.WHITE
  },
  accountBoxHeaderText: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: scale(16)
  },
  dropdownIcon: {
    textAlignVertical: 'center',
    alignSelf: 'center',
    height: scale(24),
    fontSize: scale(24),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },

  // /////// Double Row
  doubleRowContainer: {
    backgroundColor: THEME.COLORS.WHITE
  },
  // //// Beginning of Settings Row ///////
  settingsRowContainer: {
    height: scale(52),
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingLeft: scale(20),
    paddingRight: scale(20),
    justifyContent: 'space-around'
  },
  settingsRowTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%'
  },
  settingsRowLeftContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  settingsRowRightContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  settingsRowLeftText: {
    color: THEME.COLORS.GRAY_1,
    textAlign: 'left',
    fontSize: scale(16)
  },
  settingsRowLeftTextWithoutWidth: {
    color: THEME.COLORS.GRAY_1,
    textAlign: 'left',
    fontSize: scale(16)
  },
  settingsRowLeftTextDisabled: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(16)
  },
  settingsRowLeftLogo: {
    height: scale(22),
    width: scale(22), // logos are square shaped,
    marginRight: 16
  },
  settingsRowRightArrow: {
    fontSize: scale(18),
    color: THEME.COLORS.GRAY_1
  },
  settingsLocks: {
    color: THEME.COLORS.GRAY_1
  },
  modalRightText: {
    color: THEME.COLORS.SECONDARY,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  routeRowRightText: {
    color: THEME.COLORS.SECONDARY,
    fontWeight: 'bold'
  },

  // /////// End of Settings Row /////////
  debugArea: {
    backgroundColor: THEME.COLORS.GRAY_4,
    padding: scale(20),
    flex: 1
  },

  emptyBottom: {
    height: scale(51),
    flex: 1
  },

  // //////// Start of Currency Settings//////
  bitcoinSettings: {
    flex: 1
  },

  headerRow: {
    padding: scale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: scale(50)
  },
  headerText: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: scale(16)
  },
  headerIcon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: scale(22)
  },
  underlay: {
    color: 'rgba(0,0,0,0)'
  },
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },

  /// //// beginning of default fiat area ////////
  resultList: {
    backgroundColor: THEME.COLORS.WHITE,
    borderTopColor: THEME.COLORS.GRAY_3,
    borderTopWidth: 1,
    flexGrow: 1,
    flexShrink: 1
  },
  singleFiatType: {
    height: scale(60),
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingVertical: scale(10),
    paddingHorizontal: scale(15)
  },
  singleFiatTypeWrap: {
    flexDirection: 'column',
    flex: 1
  },
  fiatTypeInfoWrap: {
    flexDirection: 'row',
    height: scale(40),
    flex: 1,
    justifyContent: 'space-between'
  },
  fiatTypeLeft: {
    flexDirection: 'row'
  },
  fiatTypeLogo: {
    width: scale(40),
    height: scale(40),
    marginRight: scale(10)
  },
  fiatTypeLeftTextWrap: {
    justifyContent: 'center'
  },
  fiatTypeName: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_1,
    textAlignVertical: 'center'
  },
  underlayColor: {
    color: THEME.COLORS.GRAY_4
  },
  /// ////// end of default fiat area //////////
  bottomShim: {
    backgroundColor: THEME.COLORS.WHITE
  }
}
export default StyleSheet.create(styles)
