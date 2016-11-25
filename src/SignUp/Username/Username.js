import React, { Component } from 'react'
import { View, Text, TextInput } from 'react-native'

import routes from '../../Navigator/routes'
import style from './style'
import NextButton from '../NextButton'

class UsernameComponent extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push(routes[2])
	}

	render() {
		return (
			<View style={style.mainView}>
				<View style={style.inputView}>
					<TextInput
					  style={style.usernameInput}
					  placeholder="User Name"
					/>
					<Text style={style.paragraph}>
						This is not your email or real name.
					</Text>
					<Text style={style.paragraph}>
						This is the username to login into your account on this and other devices.
					</Text>
					<Text style={style.paragraph}>
						Your username and password are known only to you and never stored unencrypted.		
					</Text>
				</View>
				<NextButton onPress={this.handleSubmit}/>
			</View>
		)
	}
}

export default UsernameComponent
