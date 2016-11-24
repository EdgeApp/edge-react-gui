import React, { Component } from 'react'
import { 
	View,
	Text, 
	StyleSheet,
	TextInput
} from 'react-native'

import NextButton from './NextButton'

class CreatePin extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push({ title: 'Sign Up', screen: 'createPassword', index: 3})
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.inputView}>
					<Text style={styles.inputLabel}>
						Set a 4 digit PIN
					</Text>
					<TextInput
						style={styles.input}
						placeholder="Create Pin"
						keyboardType="numeric"
						maxLength={4} 
					/>
					<Text style={styles.paragraph}>
						Your PIN is a 4 digit code used to do quick re-logins into your account.
					</Text>
				</View>
				<NextButton onPress={this.handleSubmit}/>
			</View>
		);
	}
}

const styles = StyleSheet.create({

	container: {
		flex:1,
		backgroundColor: '#F5FCFF'
	},

	inputView: {
		flex:1,
		marginTop: 50,
		marginLeft: 30,
		marginRight: 30,
	},

	inputLabel: {
		fontWeight: 'bold',
		fontSize: 16
	},

	input: {
		width: 200,
		height: 60,
		fontSize: 22,
		color: 'skyblue',
		alignSelf: 'center',
		textAlign: 'center'
	},

	paragraph: {
		marginTop:10,
		fontSize:14	
	}

});

export default CreatePin
