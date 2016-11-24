import React, { Component } from 'react'
import { 
	View,
	Text, 
	StyleSheet,
	TextInput
} from 'react-native'

import NextButton from './NextButton'

class UsernameComponent extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push({ title: 'Sign Up', screen: 'createPin', index: 2})
	}

	render() {
		return (
			<View style={{flex:1}}>
				<View style={styles.inputView}>
					<TextInput
					  style={styles.usernameInput}
					  placeholder="User Name"
					/>
					<Text style={styles.paragraph}>
						This is not your email or real name.
					</Text>
					<Text style={styles.paragraph}>
						This is the username to login into your account on this and other devices.
					</Text>
					<Text style={styles.paragraph}>
					Your username and password are known only to you and never stored unencrypted.		
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
