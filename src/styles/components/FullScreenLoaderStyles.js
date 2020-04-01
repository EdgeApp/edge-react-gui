// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'

export const styles = {
  loadingContainer: {
    flex: 1,
    position: 'absolute',
    height: PLATFORM.deviceHeight,
    width: PLATFORM.deviceWidth,
    backgroundColor: THEME.COLORS.OPACITY_GRAY_1,
    zIndex: 1000
  },
  indicator: {
    flex: 1,
    alignSelf: 'center'
  }
}

export default StyleSheet.create(styles)
