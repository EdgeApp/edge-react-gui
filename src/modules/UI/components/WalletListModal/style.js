import {StyleSheet} from 'react-native'
import platform from '../../../../theme/variables/platform.js'
import THEME from '../../../../theme/variables/airbitz'

export const styles = {
  topLevel: {
    zIndex: 10,
    width: platform.deviceWidth,
    backgroundColor: THEME.COLORS.WHITE,
    alignSelf: 'stretch'
  },
  modalRoot: {
    paddingTop: 50
  },
  headerContainer: {
    backgroundColor: THEME.COLORS.GRAY_1
  },
  modalBody: {
    width: platform.deviceWidth,
    zIndex: 4
  },
  rowContainer: {
    backgroundColor: THEME.COLORS.WHITE,
    padding: 16,
    paddingLeft: 20,
    paddingRight: 20,
    justifyContent: 'space-between'
  },
  rowNameText: {
    fontSize: 18
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
    fontSize: 14
  },
  headerCloseWrap: {
    alignSelf: 'flex-end'
  },
  modalCloseWrap: {
    height: 34,
    width: 34,
    justifyContent: 'center',
    alignItems: 'center'
  },
  doneButton: {
    position: 'relative',
    top: 6
  },

  // beginning of token rows //

  tokenRowContainer: {
    padding: 16,
    paddingLeft: 30,
    paddingRight: 20,
    backgroundColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: 1,
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
    fontSize: 14
  },
  underlay: {
    color: THEME.COLORS.ROW_PRESSED
  }
    // end of token rows //
}

export default StyleSheet.create(styles)
