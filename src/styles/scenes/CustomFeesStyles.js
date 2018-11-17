// @flow

import { Platform, StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'

const styles = {
  customFeeButtonContainer: {
    marginTop: 18
  },
  feeInputWrap: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    marginTop: 0,
    marginBottom: 0,
    borderBottomColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: Platform.OS === 'ios' ? 1 : 0
  },
  feeInput: {
    height: Platform.OS === 'ios' ? 26 : 46,
    textAlign: 'center',
    fontSize: 20,
    color: THEME.COLORS.GRAY_1
  },
  modalBoxStyle: {
    top: PLATFORM.deviceHeight / 12
  },
  customFeeButton: {
    flex: -1
  }
}

export default StyleSheet.create(styles)
