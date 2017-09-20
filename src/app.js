// @flow
/* global __DEV__ */
import React, {Component} from 'react'
import {Provider} from 'react-redux'
import configureStore from './lib/configureStore'
import Main from './modules/MainConnector'

const store: {} = configureStore({})

if (!__DEV__) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  console.log = () => {}
}

export default class App extends Component<{}> {
  render () {
    return (
      <Provider store={store}>
        <Main />
      </Provider>
    )
  }
}
