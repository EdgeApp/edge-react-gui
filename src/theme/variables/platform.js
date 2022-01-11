// @flow

import { Dimensions, Platform } from 'react-native'
import ExtraDimensions from 'react-native-extra-dimensions-android'
import { isIPhoneX } from 'react-native-safe-area-view'

export const deviceWidth = Dimensions.get('window').width
export const deviceHeight = Platform.OS === 'ios' ? Dimensions.get('window').height : ExtraDimensions.get('REAL_WINDOW_HEIGHT')

export const PLATFORM = {
  // device - toolbar - footer
  usableHeight: deviceHeight - (Platform.OS === 'ios' ? 44 : 62) - 69 - (isIPhoneX ? 57 : 0),
  deviceWidth,
  deviceHeight
}
