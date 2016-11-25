import React, { Component } from 'react'
import { 
	View,
	Text, 
	StyleSheet,
	TextInput
} from 'react-native'

import NextButton from '../NextButton'

class Password extends Component {
	
	handleSubmit  = () => {
		this.props.navigator.push({ title: 'Welcome', screen: 'finished', index: 4})
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.inputView}>
					<Text style={styles.paragraph}>
						The password is used to authenticate your account and to change sensitive settings.
					</Text>
					<TextInput
						style={styles.input}
						placeholder="Choose a Password"
						keyboardType="default"
						secureTextEntry={true}
					/>
					<TextInput
						style={styles.input}
						placeholder="Re-enter Password"
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
