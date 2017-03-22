import React, { Component } from 'react'
import { Provider, connect } from 'react-redux'
import configureStore from './lib/configureStore'
import { Scene, Router } from 'react-native-router-flux'
import { Platform, AppRegistry } from 'react-native'
import t from './lib/LocaleStrings'

const RouterWithRedux = connect()(Router)
const store = configureStore()

import Landing from './modules/Landing.ui'

export default class App extends Component {
  render () {
    return (
      <Provider store={store}>
        <RouterWithRedux>
          <Scene key='root' hideNavBar>
            <Scene key='landing' component={Landing} title='Landing' initial />
          </Scene>
        </RouterWithRedux>
      </Provider>
    )
  }

}

AppRegistry.registerComponent('airbitz_ui', () => App)
