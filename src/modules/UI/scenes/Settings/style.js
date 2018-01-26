// @flow

import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

export const styles = {
  gradient: {
    height: THEME.HEADER
  },
  body: {
    padding: 18
  },
  container: {
    position: 'relative',
    height: '100%'
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
    paddingTop: 15,
    paddingBottom: 15,
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
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: 16
  },
  headerIcon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 22
  },
  underlay: {
    color: 'rgba(0,0,0,0)'
  },
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  }
}
export default StyleSheet.create(styles)
