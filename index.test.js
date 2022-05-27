/* eslint-disable no-import-assign */
// @flow
import 'react-native-gesture-handler'
import './src/app.js'

import { Tester, TestHookStore } from 'cavy'
import React, { Component } from 'react'
import * as ReactNative from 'react-native'
import Animated from 'react-native-reanimated'

// import RecordScreen from 'react-native-record-screen'
import { name as appName } from './app.json'
import AllNavigationSpec from './specs/AllNavigationSpec.js'
// import NavigationBarSpec from './specs/NavigationBarSpec.js'
import { App } from './src/components/App.js'

// See https://github.com/software-mansion/react-native-reanimated/issues/1794#issuecomment-898393331
Animated.addWhitelistedNativeProps({})

const testHookStore = new TestHookStore()

class AppWrapper extends Component<any, any> {
  render() {
    return (
      <Tester specs={[AllNavigationSpec]} store={testHookStore}>
        <App />
      </Tester>
    )
  }
}

ReactNative.AppRegistry.registerComponent(appName, () => AppWrapper)
