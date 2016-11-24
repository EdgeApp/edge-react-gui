import React, { Component } from 'react'
import { Navigator,Text } from 'react-native'

import HomeContainer from './Home/HomeContainer'
import Username from './SignUp/Username'
import PinNumber from './SignUp/PinNumber'
import Password from './SignUp/Password'

class MainContainer extends Component {
	
	routeRenderScene = (route, navigator) => {
		switch(route.screen){
			case "home":
				return <HomeContainer navigator={navigator} />
			case "createUsername":
				return <Username navigator={navigator} />
			case "createPin":
				return <CreatePin navigator={navigator} />
			case "createPassword":
				return <Password navigator={navigator} />
		}
	}

	render() {
		return (
		  <Navigator
			initialRoute={{ title: 'Airbitz', screen: 'home', index: 0}}
			renderScene={ (route, navigator) => this.routeRenderScene(route, navigator) }
	      />	
		)
	}
}

export default MainContainer
