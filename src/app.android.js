import React, { Component } from 'react'
import { Provider } from 'react-redux'
import store from './createStore'
import {Scene, Router} from 'react-native-router-flux'

import Home from './Home.ui'
import Username from './Username.ui'
import PinNumber from './PinNumber.ui'
import Password from './Password.ui'
import ReviewDetails from './ReviewDetails.ui'

export default class App extends Component {
	
	render() {
		return (
			<Provider store={store}>
        <Router>
          <Scene key="root">
            <Scene key="signup">
              <Scene key="username" component={Username} title={"Enter Username"} />
              <Scene key="pin" component={PinNumber} title={"Enter Pin"} />
              <Scene key="password" component={Password} title={"Enter Password"} />
              <Scene key="review" component={ReviewDetails} title={"Details"} />
            </Scene>
            <Scene key="home" component={Home} initial={true} />
          </Scene>
        </Router>
			</Provider>
		)
	}

}

AppRegistry.registerComponent('airbitz_ui', () => App)
