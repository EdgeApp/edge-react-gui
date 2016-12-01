import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'

import { changeUsernameValue } from './action'
import { checkUsername } from './middleware'

import routes from '../../Navigator/routes'
import NextButton from '../NextButton'
import NavigationBar from '../NavigationBar'
import ErrorModal from '../../ErrorModal/ErrorModal'
import Loader from '../../Loader/LoaderOverlay'

import style from './style'

class UsernameComponent extends Component {

	handleBack  = () => {
		this.props.navigator.pop()
	}

	handleSubmit  = () => {
		this.props.dispatch(checkUsername(this.props.username, this.props.navigator))
	}

	handleOnChangeText = (username) => {
		this.props.dispatch(changeUsernameValue(username))	
	}

	render() {

		const { username } = this.props

		return (
			<View style={style.container}>
				<NavigationBar onPress={this.handleBack}/>
				<View style={style.inputView}>
					<TextInput
					  	style={style.usernameInput}
					  	placeholder="User Name"
						onChangeText={ this.handleOnChangeText }
						value={ username }
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
				<NextButton onPress={this.handleSubmit} />
				<Loader />
				<ErrorModal />
			</View>
		)
	}
}

export default connect( state => ({

	username: state.username

}) )(UsernameComponent)
