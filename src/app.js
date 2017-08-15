// @flow
import React, { Component } from 'react'
import { Provider } from 'react-redux'
import configureStore from './lib/configureStore'
import Container from './modules/Container.ui'

const store: {} = configureStore()

if (!__DEV__) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  console.log = (...args) => {}
}

export default class App extends Component {
  render () {
    return (
      <Provider store={store}>
        <Container />
      </Provider>
    )
  }
}
