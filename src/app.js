import React, { Component } from 'react'
import { Provider, connect } from 'react-redux'
import configureStore from './lib/configureStore'
import { Platform, AppRegistry } from 'react-native'
import t from './lib/LocaleStrings'
import Container from './modules/Container.ui'

const store = configureStore()

export default class App extends Component {
  render () {
    return (
      <Provider store={store}>
        <Container />
      </Provider>
    )
  }

}

AppRegistry.registerComponent('airbitz', () => App)
