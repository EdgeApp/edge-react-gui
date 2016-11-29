import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'
import LoaderOverlay from '../../Loader/LoaderOverlay'

import { changeUsernameValue } from './action'
import routes from '../../Navigator/routes'
import abcContext from '../../abc/abcContext'

import style from './style'
import NextButton from '../NextButton'
import ErrorModal from '../../ErrorModal/ErrorModal'
import { openErrorModal } from '../../ErrorModal/action'
import { openLoading, closeLoading } from '../../Loader/action'

class UsernameComponent extends Component {

	handleSubmit  = () => {
		const navigator = this.props.navigator
		const dispatch = this.props.dispatch

		dispatch(openLoading())

		setTimeout( () => {
			dispatch(closeLoading())
			setTimeout ( () => {
				dispatch(openErrorModal('Username is not available!'))
			}, 10 )
		}, 2000 )
	}

	handleOnChangeText = (username) => {
		this.props.dispatch(changeUsernameValue(username))	
	}

	render() {

		const { username } = this.props

		return (
			<View style={style.container}>
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
				<LoaderOverlay />
				<ErrorModal />
			</View>
		)
	}
}

export default connect( state => ({
	username: state.username,
	loading: state.loading
}) )(UsernameComponent)
