// @flow

import { Dimensions, Platform } from 'react-native'

import { isIphoneX } from '../../lib/isIphoneX.js'

const deviceHeight = Dimensions.get('window').height
const deviceWidth = Dimensions.get('window').width
const platform = Platform.OS

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
