import React, { Component } from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import { connect } from 'react-redux'

import Container from '../SignUp.ui'
import Notification from './Notification.ui'
import style from './Password.style'

import { validate } from './PasswordValidation/PasswordValidation.middleware'
import { checkPassword } from './Password.middleware'
import { passwordNotificationShow } from './Password.action'
import { showNextButton, hideNextButton } from '../NextButton/NextButton.action'
import { showSkipButton, hideSkipButton } from '../SkipButton/SkipButton.action'


import t from '../../lib/LocaleStrings'
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
				this.props.validation
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
						{t('fragment_setup_password_text')}
					</Text>
					<TextInput
						style={style.input}
						placeholder={t('activity_signup_password_hint')}
						keyboardType="default"
						secureTextEntry={true}
						autoFocus={ true }
						onChangeText={ this.handleOnChangePassword }
						value={ this.props.password }
						onFocus={this.handlePasswordOnFocus}
						onBlur={this.handlePasswordOnBlur}
						returnKeyType="done"
					/>
					<TextInput
						style={style.input}
						placeholder={t('activity_signup_password_confirm_hint')}
						keyboardType="default"
						secureTextEntry={true}
						returnKeyType="next"
						onChangeText={ this.handleOnChangePasswordRepeat }
						onBlur={ this.handleSubmit }
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
