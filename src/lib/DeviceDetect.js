/* eslint-disable flowtype/require-valid-file-annotation */

import { Dimensions, PixelRatio, Platform } from 'react-native'

const windowSize = Dimensions.get('window')

class DetectDeviceService {
  constructor () {
    this.pixelDensity = PixelRatio.get()
    this.width = windowSize.width
    this.height = windowSize.height
    this.adjustedWidth = this.width * this.pixelDensity
    this.adjustedHeight = this.height * this.pixelDensity

    this.isPhoneOrTablet()
    this.isIosOrAndroid()
  }

  isPhoneOrTablet () {
    if (this.pixelDensity < 2 && (this.adjustedWidth >= 1000 || this.adjustedHeight >= 1000)) {
      this.isTablet = true
      this.isPhone = false
    } else if (this.pixelDensity === 2 && (this.adjustedWidth >= 1820 || this.adjustedHeight >= 1820)) {
      this.isTablet = true
      this.isPhone = false
    } else {
      this.isTablet = false
      this.isPhone = true
    }
  }

  isIosOrAndroid () {
    if (Platform.OS === 'ios') {
      this.isIos = true
      this.isAndroid = false
    } else {
      this.isIos = false
      this.isAndroid = true
    }
  }
}

module.exports = new DetectDeviceService()
