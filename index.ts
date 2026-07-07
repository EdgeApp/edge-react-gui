// This side-effect import must come before expo-quick-actions is evaluated:
// expo-quick-actions reads globalThis.expo.modules.ExpoQuickActions at module
// evaluation time, and that global is installed lazily by expo-modules-core.
// Without it, every expo-quick-actions call (including setItems) silently
// no-ops and the home screen shortcuts never appear.
import 'expo-modules-core'
import 'react-native-gesture-handler'
import './src/app'
import './src/perf'

import { AppRegistry } from 'react-native'
import Animated from 'react-native-reanimated'

import { name as appName } from './app.json'
import { App } from './src/components/App'

if (typeof BigInt === 'undefined') global.BigInt = require('big-integer')

// See https://github.com/software-mansion/react-native-reanimated/issues/1794#issuecomment-898393331
// For ReText/SwipeChart support requirements, see:
// https://github.com/software-mansion/react-native-reanimated/discussions/5621
// https://github.com/software-mansion/react-native-reanimated/issues/5432
Animated.addWhitelistedNativeProps({ text: true })

AppRegistry.registerComponent(appName, () => App)
