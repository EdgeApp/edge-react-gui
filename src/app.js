import React, { Component } from 'react'
import { Provider, connect } from 'react-redux'
import configureStore from './lib/configureStore'
import { Platform, AppRegistry } from 'react-native'
import t from './lib/LocaleStrings'
import Container from './modules/Container.ui'

const store = configureStore()

export function makeEngineCallbacks (wallet) {
  const transactionsChanged = (abcTransactions) => {
    // go to the store
    // find the WalletList
    // find the wallet
    // update the transaction that have changed using a dispatch
    //
  }

  const blockHeightChanged = (blockHeight) => {
    console.log('blockHeightChanged', blockHeight)
  }

  const addressesChecked = (progressRatio) => {
    console.log('addressesChecked', progressRatio)
  }
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

AppRegistry.registerComponent('airbitz', () => App)
