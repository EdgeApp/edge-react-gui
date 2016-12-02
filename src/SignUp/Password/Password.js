import React, { Component } from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import { connect } from 'react-redux'

import Container from '../Container'
import Notification from './Notification'
import style from './style'

import { validate } from './PasswordValidation/middleware'
import { checkPassword } from './middleware'
import { passwordNotificationShow } from './action'
import { showNextButton, hideNextButton } from '../NextButton/action'
import { showSkipButton, hideSkipButton } from '../SkipButton/action'
import { navigatorPush } from '../../Navigator/action'

import { 
	focusPasswordInput, 
	blurPasswordInput,
	changePasswordValue,
	changePasswordRepeatValue
} from './action'

class Password extends Component {
	
	handleSubmit  = () => {
		this.props.dispatch(
			checkPassword(
				this.props.password,
				this.props.passwordRepeat,
				this.props.validation,
				this.props.navigator
			)
		)
	}

	handlePasswordNotification  = () => {
		this.props.dispatch(passwordNotificationShow())
	}

	handleSkipPassword  = () => {
		this.props.dispatch(navigatorPush())
	}

	handlePasswordOnFocus = () => {
		this.props.dispatch(focusPasswordInput())		
	}

	handlePasswordOnBlur = () => {
		this.props.dispatch(blurPasswordInput())		
	}

	handleOnChangePassword = (password) => {
		this.props.dispatch(changePasswordValue(password))	
		this.props.dispatch(validate(password))	
	}

	handleOnChangePasswordRepeat = (passwordRepeat) => {
		this.props.dispatch(changePasswordRepeatValue(passwordRepeat))	
	}

	checkPasswordInputState = () => this.props.inputState ? { marginTop: 10 } : null

	render() {
		return (
			<Container 
				handleSubmit={this.handleSubmit} 
				handleSkip={this.handlePasswordNotification}
			>
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
				<Notification handleSubmit={this.handleSkipPassword}/>
			</Container>
		)
	}
}

export default connect( state => ({

	inputState		: state.password.inputState,
	password		: state.password.password,
	passwordRepeat 	: state.password.passwordRepeat,
	validation		: state.password.validation
	
}) )(Password)
