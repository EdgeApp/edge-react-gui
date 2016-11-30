import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'

import { changePinNumberValue } from './action'
import { checkPIN } from './middleware'

import NextButton from '../NextButton'
import ErrorModal from '../../ErrorModal/ErrorModal'
import style from './style'
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
			<View style={style.container}>
				<View style={style.inputView}>
					<Text style={style.inputLabel}>
						{t('fragment_setup_pin_title')}
					</Text>
					<TextInput
						style={style.input}
						placeholder={t('activity_signup_pin_hint')}
						keyboardType="numeric"
						maxLength={4} 
						onChangeText={ this.handleOnChangeText }
						value={ pinNumber }
					/>
					<Text style={style.paragraph}>
						{t('fragment_setup_pin_text')}
					</Text>
				</View>
				<NextButton onPress={this.handleSubmit} />
				<ErrorModal />
			</View>
		);
	}
}


export default connect( state => ({

	pinNumber: state.pinNumber

}) )(PinComponent)
