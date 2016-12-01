import React, { Component } from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import { connect } from 'react-redux'

import Container from '../Container'
import style from './style'

import { 
	focusPasswordInput, 
	blurPasswordInput,
	changePasswordValue,
	changePasswordRepeatValue
} from './action'

class Password extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push({ title: 'Welcome', screen: 'checkSignIn', index: 4})
	}

	handlePasswordOnFocus = () => {
		this.props.dispatch(focusPasswordInput())		
	}

	handlePasswordOnBlur = () => {
		this.props.dispatch(blurPasswordInput())		
	}

	handleOnChangePassword = (password) => {
		this.props.dispatch(changePasswordValue(password))	
	}

	handleOnChangePasswordRepeat = (passwordRepeat) => {
		this.props.dispatch(changePasswordRepeatValue(passwordRepeat))	
	}

	checkPasswordInputState = () => this.props.inputState ? { marginTop: 10 } : null

	render() {
		return (
			<Container handleSubmit={this.handleSubmit} navigator={this.props.navigator}>
				<View style={[ style.inputView, this.checkPasswordInputState() ]}>
					<Text style={style.paragraph}>
						The password is used to authenticate your account and to change sensitive settings.
					</Text>
					<TextInput
						style={style.input}
						placeholder="Choose a Password"
						keyboardType="default"
						secureTextEntry={true}
						onChangeText={ this.handleOnChangePassword }
						value={ this.props.password }
						onFocus={this.handlePasswordOnFocus}
						onBlur={this.handlePasswordOnBlur}
					/>
					<TextInput
						style={style.input}
						placeholder="Re-enter Password"
						keyboardType="default"
						secureTextEntry={true}
						onChangeText={ this.handleOnChangePasswordRepeat }
						value={ this.props.passwordRepeat }
					/>
				</View>
			</Container>
		)
	}
}

export default connect( state => ({

	inputState		: state.password.inputState,
	password		: state.password.password,
	passwordRepeat 	: state.password.passwordRepeat
	
}) )(Password)
