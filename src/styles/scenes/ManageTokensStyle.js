// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

export const underlayColor = THEME.COLORS.PRIMARY_BUTTON_TOUCHED

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE,
    paddingBottom: scale(50)
  },
  icon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: scale(22),
    color: THEME.COLORS.WHITE
  },
  instructionalArea: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(20)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center'
  },
  metaTokenListArea: {
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.GRAY_3,
    flex: 1
  },
  metaTokenListWrap: {
    flex: 1
  },
  tokenList: {
    flex: 1
  },

  /// //// start of token row styling ///////
  manageTokenRow: {
    height: scale(44),
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingLeft: scale(20),
    paddingRight: scale(20)
  },
  rowLeftArea: {
    flexDirection: 'row'
  },
  manageTokenRowInterior: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  touchableCheckboxInterior: {
    paddingHorizontal: scale(8),
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkBox: {
    alignSelf: 'center'
  },
  tokenNameArea: {
    alignSelf: 'center'
  },
  tokenNameText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(16)
  },
  tokenCheckboxArea: {
    alignSelf: 'center'
  },
  rowRightArrow: {
    fontSize: scale(18),
    color: THEME.COLORS.GRAY_1
  },
  /// //// end of token row styling /////////

  buttonsArea: {
    height: scale(52),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: scale(4),
    paddingHorizontal: scale(20)
  },
  addButton: {
    flex: 1,
    marginLeft: scale(2),
    backgroundColor: THEME.COLORS.GRAY_2,
    borderRadius: 3
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(17.5)
  },
  saveButton: {
    flex: 1,
    marginRight: scale(2),
    backgroundColor: THEME.COLORS.SECONDARY,
    borderRadius: 3
  },
  oneButton: {
    flex: 1,
    backgroundColor: THEME.COLORS.SECONDARY,
    borderRadius: 3
  }
})
