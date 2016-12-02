import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'

import { changeUsernameValue } from './action'
import { checkUsername } from './middleware'

import Container from '../Container'

import style from './style'

class UsernameComponent extends Component {

	handleSubmit  = () => {
		this.props.dispatch(checkUsername(this.props.username))
	}

	handleOnChangeText = (username) => {
		this.props.dispatch(changeUsernameValue(username))	
	}

	render() {
		const { username } = this.props
		return (
			<Container handleSubmit={this.handleSubmit}>
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
			</Container>
		)
	}
}

export default connect( state => ({

	username: state.username

}) )(UsernameComponent)
