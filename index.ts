import 'react-native-gesture-handler'
import './src/app'

import { AppRegistry } from 'react-native'
import Animated from 'react-native-reanimated'

import { name as appName } from './app.json'
import { App } from './src/components/App'

if (typeof BigInt === 'undefined') global.BigInt = require('big-integer')

// See https://github.com/software-mansion/react-native-reanimated/issues/1794#issuecomment-898393331
Animated.addWhitelistedNativeProps({})

AppRegistry.registerComponent(appName, () => App)
