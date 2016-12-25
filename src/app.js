import React, { Component } from 'react'
import { Provider, connect } from 'react-redux'
import configureStore from './lib/configureStore'
import { Scene, Router } from 'react-native-router-flux'
import { AppRegistry } from 'react-native'

String.format = function (format) {
  const args = Array.prototype.slice.call(arguments, 1)
  return format.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== 'undefined'
      ? args[number]
      : match
  })
}

import Landing from './modules/Landing.ui'
import Home from './modules/Home/Home.ui'
import Username from './modules/Username/Username.ui'
import PinNumber from './modules/PinNumber/PinNumber.ui'
import Password from './modules/Password/Password.ui'
import CameraNotification from './modules/SignUpNotifications/Camera.ui'
import ContactNotification from './modules/SignUpNotifications/Contact.ui'
import ReviewDetails from './modules/ReviewDetails/ReviewDetails.ui'

const RouterWithRedux = connect()(Router)
const store = configureStore()

export default class App extends Component {

  render () {
    return (
      <Provider store={store}>
        <RouterWithRedux>
          <Scene key='root'>
            <Scene key='signup' hideNavBar>
              <Scene key='username' component={Username} title={'Enter Username'} initial />
              <Scene key='pin' component={PinNumber} title={'Enter Pin'} />
              <Scene key='password' component={Password} title={'Enter Password'} />
              <Scene key='cameraNotification' component={CameraNotification} title={'Camera Notification'} type='reset' />
              <Scene key='contactNotification' component={ContactNotification} title={'Contact Notification'} type='reset' />
              <Scene key='review' component={ReviewDetails} title={'Details'} type='reset' />
            </Scene>
            <Scene key='landing' component={Landing} type='reset' initial hideNavBar />
            <Scene key='home' component={Home} hideNavBar type='reset' />
          </Scene>
        </RouterWithRedux>
      </Provider>
    )
  }

}

AppRegistry.registerComponent('airbitz_ui', () => App)
