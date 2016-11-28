import React, { Component } from 'react'
import { 
	View,
	Text, 
	StyleSheet,
	TextInput
} from 'react-native'

import NextButton from './NextButton'

import t from '../lib/LocaleStrings'

class CreatePin extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push({ title: t('activity_signup_title'), screen: 'createPassword', index: 3})
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.inputView}>
					<Text style={styles.inputLabel}>
						{t('fragment_setup_pin_title')}
					</Text>
					<TextInput
						style={styles.input}
						placeholder={t('activity_signup_pin_hint')}
						keyboardType="numeric"
						maxLength={4} 
					/>
					<Text style={styles.paragraph}>
						{t('fragment_setup_pin_text')}
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
