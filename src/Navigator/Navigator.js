import React, { Component } from 'react'
import { Navigator,View,Text } from 'react-native'

import HomeContainer from '../Home/HomeContainer'
import Username from '../SignUp/Username/Username'
import PinNumber from '../SignUp/PinNumber/PinNumber'
import Password from '../SignUp/Password/Password'
import ReviewDetails from '../SignUp/ReviewDetails/ReviewDetails'

import routes from './routes'

class NavigatorContainer extends Component {
	
	routeRenderScene = (route, navigator) => {

		switch(route.screen){
			case "home":
				return <HomeContainer navigator={navigator} />
			case "createUsername":
				return <Username />
					
			case "createPin":
				return <PinNumber />	
				
			case "createPassword":
				return <Password />
				
			case "reviewSignIn":
				return <ReviewDetails />
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
