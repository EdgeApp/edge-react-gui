import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TextInput } from 'react-native'

import { changePinNumberValue } from './action'
import { checkPIN } from './middleware'

import NavigationBar from '../NavigationBar'
import NextButton from '../NextButton'
import ErrorModal from '../../ErrorModal/ErrorModal'
import style from './style'

class PinComponent extends Component {
	

	handleBack  = () => {
		this.props.navigator.pop()
	}

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
				<NavigationBar onPress={this.handleBack}/>
				<View style={style.inputView}>
					<Text style={style.inputLabel}>
						Set a 4 digit PIN
					</Text>
					<TextInput
						style={style.input}
						placeholder="Create Pin"
						keyboardType="numeric"
						maxLength={4} 
						onChangeText={ this.handleOnChangeText }
						value={ pinNumber }
					/>
					<Text style={style.paragraph}>
						Your PIN is a 4 digit code used to do quick re-logins into your account.
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
