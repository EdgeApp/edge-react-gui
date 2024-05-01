import 'react-native-gesture-handler'
import './src/app'

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
