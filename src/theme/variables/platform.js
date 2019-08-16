// @flow

import { Dimensions, Platform } from 'react-native'
import ExtraDimensions from 'react-native-extra-dimensions-android'

import { isIphoneX } from '../../util/isIphoneX.js'

const platform = Platform.OS
const deviceWidth = Dimensions.get('window').width
const deviceHeight = platform === 'ios' ? Dimensions.get('window').height : ExtraDimensions.get('REAL_WINDOW_HEIGHT')

const PLATFORM = {
  platform,

  // device - toolbar - footer
  usableHeight: deviceHeight - (platform === 'ios' ? 44 : 62) - 69 - (isIphoneX ? 57 : 0),
  isIphoneX,
  deviceWidth,
  deviceHeight
}

export { PLATFORM }
