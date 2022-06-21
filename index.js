// @flow

import 'react-native-gesture-handler'
import './src/app.js'

import { AppRegistry } from 'react-native'
import Animated from 'react-native-reanimated'

import { name as appName } from './app.json'
import { App } from './src/components/App.js'

// See https://github.com/software-mansion/react-native-reanimated/issues/1794#issuecomment-898393331
Animated.addWhitelistedNativeProps({})

// Hack for react-native-reanimated-carousel
// https://github.com/dohooo/react-native-reanimated-carousel/issues/159#issuecomment-1131480569
global.__reanimatedWorkletInit = () => {}

AppRegistry.registerComponent(appName, () => App)
