// @flow

import {StyleSheet} from 'react-native'
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
  }
}

export default StyleSheet.create(styles)
