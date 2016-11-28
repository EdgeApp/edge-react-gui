import React, { Component } from 'react'
import { Navigator } from 'react-native'

import HomeContainer from '../Home/HomeContainer'
import Username from '../SignUp/Username/Username'
import PinNumber from '../SignUp/PinNumber/PinNumber'
import Password from '../SignUp/Password/Password'

import routes from './routes'

class NavigatorContainer extends Component {
	
	routeRenderScene = (route, navigator) => {
		switch(route.screen){
			case "home":
				return <HomeContainer {...this.props} navigator={navigator} />
			case "createUsername":
				return <Username {...this.props} navigator={navigator} />
			case "createPin":
				return <PinNumber {...this.props} navigator={navigator} />
			case "createPassword":
				return <Password {...this.props} navigator={navigator} />
		}
	}

	render() {
		return (
		  <Navigator
			initialRoute={routes[0]}
			initialRouteStack={routes}
			renderScene={ (route, navigator) => this.routeRenderScene(route, navigator) }
	      />	
		)
	}
}

export default NavigatorContainer
