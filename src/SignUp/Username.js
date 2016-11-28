import React, { Component } from 'react'
import { 
	View,
	Text, 
	StyleSheet,
	TextInput
} from 'react-native'

import NextButton from './NextButton'

import t from '../lib/LocaleStrings'

class UsernameComponent extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push({ title: t('activity_signup_title'), screen: 'createPin', index: 2})
	}

	render() {
		return (
			<View style={{flex:1}}>
				<View style={styles.inputView}>
					<TextInput
					  style={styles.usernameInput}
					  placeholder={t('fragment_landing_username_hint')}
					/>
					<Text style={styles.paragraph}>
						{t('fragment_setup_username_text')}
					</Text>
				</View>
				<NextButton onPress={this.handleSubmit}/>
			</View>
		)
	}
}

const styles = StyleSheet.create({

	inputView: {
		flex:1,
		marginTop: 50,
		marginLeft: 30,
		marginRight: 30,
	},

	usernameInput: {
		height: 60,
		fontSize: 22,
		color: 'skyblue',
	},

	paragraph: {
		marginTop:10,
		fontSize:14	
	}

});

export default UsernameComponent
