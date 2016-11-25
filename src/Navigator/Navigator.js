import React, { Component } from 'react'
import { Navigator } from 'react-native'

import HomeContainer from '../Home/HomeContainer'
import Username from '../SignUp/Username/Username'
import PinNumber from '../SignUp/PinNumber'
import Password from '../SignUp/Password'

import routes from './routes'

class NavigatorContainer extends Component {
	
	routeRenderScene = (route, navigator) => {
		switch(route.screen){
			case "home":
				return <HomeContainer navigator={navigator} />
			case "createUsername":
				return <Username navigator={navigator} />
			case "createPin":
				return <PinNumber navigator={navigator} />
			case "createPassword":
				return <Password navigator={navigator} />
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
