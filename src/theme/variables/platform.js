// @flow

import { Dimensions, Platform } from 'react-native'
import ExtraDimensions from 'react-native-extra-dimensions-android'

import { isIphoneX } from '../../lib/isIphoneX.js'

const ANDROID_REAL_WINDOW_HEIGHT = ExtraDimensions.get('REAL_WINDOW_HEIGHT')

const platform = Platform.OS
const deviceWidth = Dimensions.get('window').width
const deviceHeight = platform === 'ios' ? Dimensions.get('window').height : ANDROID_REAL_WINDOW_HEIGHT

const PLATFORM = {
  platform,

  // Footer
  footerHeight: 50,
  toolbarHeight: platform === 'ios' ? 44 : 56,

  // based on footerHeight, toolbarHeight, and deviceHeight
  usableHeight: deviceHeight - (platform === 'ios' ? 44 : 62) - 69 - (isIphoneX ? 57 : 0), // device - toolbar - footer
  isIphoneX,
  deviceWidth,
  deviceHeight
}

export { PLATFORM }
