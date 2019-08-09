// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform.js'
import { scale } from '../../../../util/scaling.js'

export const styles = {
  topLevel: {
    zIndex: 10,
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE,
    alignSelf: 'stretch'
  },
  modalRoot: {
    paddingTop: scale(50)
  },
  headerContainer: {
    backgroundColor: THEME.COLORS.GRAY_1,
    paddingVertical: scale(8)
  },
  modalBody: {
    width: PLATFORM.deviceWidth,
    zIndex: 4
  },
  rowContainer: {
    backgroundColor: THEME.COLORS.WHITE,
    padding: scale(16),
    paddingLeft: scale(20),
    paddingRight: scale(20),
    justifyContent: 'space-between'
  },
  rowNameText: {
    fontSize: scale(18),
    fontFamily: THEME.FONTS.DEFAULT
  },
  headerContent: {
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  headerTextWrap: {
    justifyContent: 'center'
  },
  headerText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    fontFamily: THEME.FONTS.DEFAULT
  },
  headerCloseWrap: {
    alignSelf: 'flex-end'
  },
  modalCloseWrap: {
    height: scale(34),
    width: scale(34),
    justifyContent: 'center',
    alignItems: 'center'
  },
  doneButton: {
    position: 'relative',
    top: scale(6)
  },

  // beginning of token rows //

  tokenRowContainer: {
    padding: scale(16),
    paddingLeft: scale(30),
    paddingRight: scale(20),
    backgroundColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: scale(1),
    borderColor: THEME.COLORS.GRAY_3
  },
  currencyRowContent: {
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  currencyRowNameTextWrap: {
    justifyContent: 'center'
  },
  currencyRowText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(14),
    fontFamily: THEME.FONTS.DEFAULT
  },
  underlay: {
    color: THEME.COLORS.ROW_PRESSED
  },
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  }
  // end of token rows //
}

export default StyleSheet.create(styles)
