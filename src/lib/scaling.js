// @flow
import { moderateVScale } from 'react-native-size-matters'

export const scale = (arg: number) => {
  return moderateVScale(arg, 0.9)
}
