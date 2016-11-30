import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'

import { changeUsernameValue } from './action'
import { checkUsername } from './middleware'

import NextButton from '../NextButton'
import ErrorModal from '../../ErrorModal/ErrorModal'
import Loader from '../../Loader/LoaderOverlay'

import style from './style'
import t from '../../lib/LocaleStrings'

class UsernameComponent extends Component {

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
				<View style={style.inputView}>
					<TextInput
					  	style={style.usernameInput}
							placeholder={t('fragment_landing_username_hint')}
						onChangeText={ this.handleOnChangeText }
						value={ username }
					/>
					<Text style={style.paragraph}>
						{t('fragment_setup_username_text')}
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
