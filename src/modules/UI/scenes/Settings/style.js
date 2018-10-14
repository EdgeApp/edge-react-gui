// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform'

export const styles = {
  usableHeight: PLATFORM.usableHeight,
  gradient: {
    height: THEME.HEADER
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    backgroundColor: THEME.COLORS.WHITE
  },
  container: {
    position: 'relative',
    height: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: 20,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT,
    marginLeft: 8
  },
  listStyle: {
    height: 100
  },
  unlockRow: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50
  },
  leftArea: {
    flexDirection: 'row'
  },
  icon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 22,
    color: THEME.COLORS.WHITE
  },
  accountBoxHeaderText: {
    fontSize: 18,
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: 16
  },
  dropdownIcon: {
    textAlignVertical: 'center',
    alignSelf: 'center',
    height: 24,
    fontSize: 24,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },

  // //// Beginning of Settings Row ///////
  settingsRowContainer: {
    height: 44,
    backgroundColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingLeft: 20,
    paddingRight: 20,
    justifyContent: 'space-around'
  },
  settingsRowTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  settingsRowLeftContainer: {
    justifyContent: 'center'
  },
  settingsRowRightContainer: {
    justifyContent: 'center'
  },
  settingsRowLeftText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: 16
  },
  settingsRowLeftTextDisabled: {
    color: THEME.COLORS.GRAY_2,
    fontSize: 16
  },
  settingsRowRightArrow: {
    fontSize: 18,
    color: THEME.COLORS.GRAY_1
  },
  settingsLocks: {
    color: THEME.COLORS.GRAY_1
  },
  modalRightText: {
    color: THEME.COLORS.SECONDARY,
    fontWeight: 'bold'
  },
  routeRowRightText: {
    color: THEME.COLORS.SECONDARY,
    fontWeight: 'bold'
  },

  // /////// End of Settings Row /////////
  debugArea: {
    backgroundColor: THEME.COLORS.GRAY_4,
    padding: 20,
    flex: 1
  },

  emptyBottom: {
    height: 51,
    flex: 1
  },

  // //////// Start of Currency Settings//////
  bitcoinSettings: {
    flex: 1
  },

  headerRow: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50
  },
  headerText: {
    fontSize: 18,
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  headerIcon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 22
  },
  currencyHeaderIcon: {
    height: 25,
    width: 25,
    resizeMode: 'contain',
    marginRight: 12
  },
  underlay: {
    color: 'rgba(0,0,0,0)'
  },
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },

  /// //// beginning of default fiat area ////////
  searchContainer: {
    marginTop: 8,
    position: 'relative',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    width: '100%'
  },

  singleFiatType: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingVertical: 10,
    paddingHorizontal: 15
  },
  singleFiatTypeWrap: {
    flexDirection: 'column',
    flex: 1
  },
  fiatTypeInfoWrap: {
    flexDirection: 'row',
    height: 40,
    flex: 1,
    justifyContent: 'space-between'
  },
  fiatTypeLeft: {
    flexDirection: 'row'
  },
  fiatTypeLogo: {
    width: 40,
    height: 40,
    marginRight: 10
  },
  fiatTypeLeftTextWrap: {
    justifyContent: 'center'
  },
  fiatTypeName: {
    fontSize: 16,
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
