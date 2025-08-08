import 'react-native-gesture-handler'
import './src/app'
import './src/perf'

import { AppRegistry } from 'react-native'

import { name as appName } from './app.json'
import { App } from './src/components/App'

if (typeof BigInt === 'undefined') global.BigInt = require('big-integer')

AppRegistry.registerComponent(appName, () => App)
