import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'

import { changePinNumberValue } from './PinNumber.action'
import { checkPIN } from './PinNumber.middleware'

import Container from '../SignUp.ui'
import style from './PinNumber.style'
import t from '../../lib/LocaleStrings'


class PinComponent extends Component {
	
	handleSubmit  = () => {
		this.props.dispatch(
			checkPIN(this.props.pinNumber, this.props.navigator)
		)
	}

	handleOnChangeText = (pinNumber) => {
		this.props.dispatch(changePinNumberValue(pinNumber))	
	}

	render() {
		const pinNumber = this.props.pinNumber
		return (
			<Container handleSubmit={this.handleSubmit} navigator={this.props.navigator}>
				<View style={style.inputView}>
					<Text style={style.inputLabel}>
						{t('fragment_setup_pin_title')}
					</Text>
					<TextInput
						style={style.input}
						placeholder={t('activity_signup_pin_hint')}
						keyboardType="numeric"
						maxLength={4} 
						autoFocus={ true }
						autoCorrect={ false }
						returnKeyType="next"
						onChangeText={ this.handleOnChangeText }
						value={ pinNumber }
						blurOnSubmit={ true }
						onSubmitEditing={ this.handleSubmit }	
					/>
					<Text style={style.paragraph}>
						{t('fragment_setup_pin_text')}
					</Text>
				</View>
			</Container>
		)
	}
}


export default connect( state => ({

	pinNumber: state.pinNumber

}) )(PinComponent)
