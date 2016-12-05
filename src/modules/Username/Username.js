import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'

import { changeUsernameValue } from './action'
import { checkUsername } from './middleware'

import Container from '../Container'

import style from './style'
import t from '../../lib/LocaleStrings'

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
							placeholder={t('fragment_landing_username_hint')}
						onChangeText={ this.handleOnChangeText }
						value={ username }
						autoFocus={ true }
						blurOnSubmit={ true }
						returnKeyType="next"
						onSubmitEditing={ this.handleSubmit }	
					/>
					<Text style={style.paragraph}>
						{t('fragment_setup_username_text')}
					</Text>
				</View>
			</Container>
		)
	}
}



export default connect( state => ({

	username: state.username

}) )(UsernameComponent)
