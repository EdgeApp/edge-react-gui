// @flow

import { Dimensions, Platform } from 'react-native'

const { height, width } = Dimensions.get('window')
const isIphoneX: boolean = Platform.OS === 'ios' && (height === 812 || width === 812)

export { isIphoneX }
