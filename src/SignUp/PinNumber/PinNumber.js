import React, { Component } from 'react'
import { connect } from 'react-redux'
import { 
	View,
	Text, 
	StyleSheet,
	TextInput
} from 'react-native'

import NextButton from '../NextButton'
import routes from '../../Navigator/routes'

import { changePinNumberValue } from './action'
import style from './style'

class PinComponent extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push(routes[3])
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
				<NextButton onPress={this.handleSubmit}/>
			</View>
		);
	}
}


export default connect( state => ({
	username: state.pinNumber
}) )(PinComponent)
