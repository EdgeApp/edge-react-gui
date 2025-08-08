import 'react-native-gesture-handler'
import './src/app'
import './src/perf'

import { AppRegistry } from 'react-native'

import { name as appName } from './app.json'
import { App } from './src/components/App'

AppRegistry.registerComponent(appName, () => App)
