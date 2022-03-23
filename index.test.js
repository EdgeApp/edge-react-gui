import 'react-native-gesture-handler'
import './src/app.js'

import { Tester, TestHookStore, wrap } from 'cavy'
import React, { Component } from 'react'
import * as ReactNative from 'react-native'
import Animated from 'react-native-reanimated'

import { name as appName } from './app.json'
import ExampleSpec from './specs/exampleSpec'
import MenuTabSpec from './specs/MenuTabSpec'
import { App } from './src/components/App.js'

// See https://github.com/software-mansion/react-native-reanimated/issues/1794#issuecomment-898393331
Animated.addWhitelistedNativeProps({})

// eslint-disable-next-line no-import-assign
ReactNative.TouchableOpacity = wrap(ReactNative.TouchableOpacity)

// eslint-disable-next-line no-import-assign
ReactNative.Pressable = wrap(ReactNative.Pressable)

const testHookStore = new TestHookStore()

class AppWrapper extends Component {
  render() {
    return (
      <Tester specs={[ExampleSpec, MenuTabSpec]} store={testHookStore}>
        <App />
      </Tester>
    )
  }
}

ReactNative.AppRegistry.registerComponent(appName, () => AppWrapper)
