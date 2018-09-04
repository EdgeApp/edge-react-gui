// @flow
import { moderateScale, verticalScale } from 'react-native-size-matters'

import { isIphoneX } from './isIphoneX'

export const scale = (arg: number) => {
  const iPhoneXScale = arg + arg * 0.1
  return isIphoneX ? verticalScale(iPhoneXScale) : moderateScale(arg, 0.68)
}
