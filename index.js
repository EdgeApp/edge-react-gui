// @flow

import './src/app.js'

import { AppRegistry } from 'react-native'

import { name as appName } from './app.json'
import { App } from './src/components/App.js'

AppRegistry.registerComponent(appName, () => App)
