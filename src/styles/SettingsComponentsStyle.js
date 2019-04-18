// @flow

import { StyleSheet } from 'react-native'

import { isIphoneX } from '../lib/isIphoneX.js'
import THEME from '../theme/variables/airbitz'
import { PLATFORM } from '../theme/variables/platform.js'

export const styles = {
  stylizedButtonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 16
  },
  cancelButtonWrap: {
    backgroundColor: THEME.COLORS.GRAY_2,
    alignSelf: 'flex-start'
  },
  cancelButton: {
    color: THEME.COLORS.PRIMARY
  },
  doneButtonWrap: {
    backgroundColor: THEME.COLORS.SECONDARY,
    alignSelf: 'flex-end',
    marginLeft: 4
  },
  doneButton: {
    color: THEME.COLORS.PRIMARY
  },
  okButton: {
    marginTop: 16,
    flex: 1
  },
  rowContainer: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'space-around'
  },
  rowTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  rowLeftContainer: {
    justifyContent: 'center'
  },
  rowLeftText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: 16
  },
  radioButton: {
    height: 24,
    color: THEME.COLORS.SECONDARY,
    fontSize: 24
  },
  radioButtonSelected: {
    color: THEME.COLORS.GRAY_1
  },
  sendLogsModalInput: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.GRAY_4,
    color: THEME.COLORS.GRAY_1,
    height: 50,
    padding: 5
  },
  icon: {
    color: THEME.COLORS.PRIMARY,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    zIndex: 1015,
    elevation: 1015
  },
  underlay: {
    color: THEME.COLORS.GRAY_4
  },
  autoLogoutMiddleContainer: {
    flexDirection: 'row'
  },
  autoLogoutDialogTitle: {
    color: THEME.COLORS.PRIMARY
  },
  autoLogoutPickerContainer: {
    flex: 1,
    margin: 4
  },
  txIDIcon: {},
  customNodesInputWrap: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 3,
    height: PLATFORM.deviceHeight * 0.13 - (PLATFORM.platform === 'android' ? 23 : 0) + (isIphoneX ? 60 : 0),
    padding: 3
  },
  customNodesInput: {
    height: PLATFORM.deviceHeight * 0.13 - (PLATFORM.platform === 'android' ? 23 : 0) + (isIphoneX ? 60 : 0) - 8,
    color: THEME.COLORS.GRAY_1,
    fontSize: 15,
    fontFamily: THEME.FONTS.DEFAULT,
    paddingVertical: 0,
    textAlignVertical: 'top'
  },
  buttonsWrap: {
    flexDirection: 'column'
  },
  primaryButton: {
    marginBottom: 8
  },
  primaryButtonText: {
    color: THEME.COLORS.WHITE
  },
  secondaryButtonText: {
    color: THEME.COLORS.WHITE
  },
  placeholderText: {
    color: THEME.COLORS.GRAY_2
  },
  placeholderUnderline: {
    color: THEME.COLORS.TRANSPARENT
  }
}

export default StyleSheet.create(styles)
