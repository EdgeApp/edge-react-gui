// @flow

import './src/app.js'

import { AppRegistry } from 'react-native'

import { name as appName } from './app.json'
import { ErrorBoundary } from './src/components/services/ErrorBoundary.js'

AppRegistry.registerComponent(appName, () => ErrorBoundary)
