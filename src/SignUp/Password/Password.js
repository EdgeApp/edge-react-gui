import React, { Component } from 'react'
import { 
	View,
	Text, 
	StyleSheet,
	TextInput
} from 'react-native'

import NextButton from '../NextButton'

import t from '../../lib/LocaleStrings'

class Password extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push({ title: t('fragment_setup_password_title'), screen: 'finished', index: 4})
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.inputView}>
					<Text style={styles.paragraph}>
						{t('fragment_setup_password_text')}
					</Text>
					<TextInput
						style={styles.input}
						placeholder={t('activity_signup_password_hint')}
						keyboardType="default"
						secureTextEntry={true}
					/>
					<TextInput
						style={styles.input}
						placeholder={t('activity_signup_password_confirm_hint')}
						keyboardType="default"
						secureTextEntry={true}
					/>
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

	input: {
		height: 60,
		fontSize: 22,
		color: 'skyblue',
	},

	paragraph: {
		marginTop:10,
		fontSize:14	
	}

});

export default Password
