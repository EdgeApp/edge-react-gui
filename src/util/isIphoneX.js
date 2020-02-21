// @flow

import { Dimensions, Platform } from 'react-native'

const { height, width } = Dimensions.get('window')
export const isIphoneX: boolean = Platform.OS === 'ios' && (height === 812 || width === 812)
