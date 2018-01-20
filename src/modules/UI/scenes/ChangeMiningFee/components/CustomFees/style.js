// @flow

import { StyleSheet, Platform } from 'react-native'
import THEME from '../../../../../../theme/variables/airbitz'

const styles = {
  customFeeButton: {
    backgroundColor: THEME.COLORS.SECONDARY,
    borderRadius: 3
  },
  customFeeButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 25,
    alignSelf: 'center',
    height: 52,
    width: 250
  },
  feeInputWrap: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    marginTop: 0,
    marginBottom: 0,
    borderBottomColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: (Platform.OS === 'ios')
      ? 1
      : 0
  },
  feeInput: {
    height: (Platform.OS === 'ios')
      ? 26
      : 46,
    textAlign: 'center',
    fontSize: 20,
    color: THEME.COLORS.GRAY_1
  }
}

export default StyleSheet.create(styles)
