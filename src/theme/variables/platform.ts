import { Dimensions, Platform } from 'react-native'
import ExtraDimensions from 'react-native-extra-dimensions-android'

export const deviceWidth = Dimensions.get('window').width
export const deviceHeight = Platform.OS === 'ios' ? Dimensions.get('window').height : ExtraDimensions.get('REAL_WINDOW_HEIGHT')

export const PLATFORM = {
  deviceWidth,
  deviceHeight
}
