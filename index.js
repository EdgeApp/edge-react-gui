// @flow

import './src/app.js'

import { AppRegistry } from 'react-native'

import { name as appName } from './app.json'
import { EdgeCoreManager } from './src/components/services/EdgeCoreManager.js'

AppRegistry.registerComponent(appName, () => EdgeCoreManager)
