/* eslint-disable flowtype/require-valid-file-annotation */

import './shim.js'

import { AppRegistry } from 'react-native'

import { name as appName } from './app.json'
import App from './src/app.js'

AppRegistry.registerComponent(appName, () => App)
