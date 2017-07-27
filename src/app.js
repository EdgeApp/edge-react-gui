import React, { Component } from 'react'
import { Provider } from 'react-redux'
import configureStore from './lib/configureStore'
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
