import React, { Component } from 'react'
import { 
	View,
	Text, 
	StyleSheet,
	TextInput
} from 'react-native'

import NextButton from './NextButton'
import style from './style'

class PinComponent extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push({ title: 'Sign Up', screen: 'createPassword', index: 3})
	}

	render() {
		return (
			<View style={style.container}>
				<View style={style.inputView}>
					<Text style={style.inputLabel}>
						Set a 4 digit PIN
					</Text>
					<TextInput
						style={style.input}
						placeholder="Create Pin"
						keyboardType="numeric"
						maxLength={4} 
					/>
					<Text style={style.paragraph}>
						Your PIN is a 4 digit code used to do quick re-logins into your account.
					</Text>
				</View>
				<NextButton onPress={this.handleSubmit}/>
			</View>
		);
	}
}


export default PinComponent
