import { Dimensions, Platform } from 'react-native'

const isIphoneX = () => {
  const { height, width } = Dimensions.get('window')
  return Platform.OS === 'ios' && (height === 812 || width === 812)
}

export default isIphoneX
