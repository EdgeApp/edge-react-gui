import React, { Component } from 'react'
import LoaderOverlay from '../Loader/LoaderOverlay'
import { 
	Text, 
	Button,
	View,
	StyleSheet } from 'react-native'

class HomeComponent extends Component {
	
	handleOnPress  = () => {
		this.props.navigator.push({ title: 'Sign Up', screen: 'createUsername', index: 1})
	}

	render() {
		return (
			<View>
				<Text style={styles.welcome}>
					Airbitz
				</Text>
				<Button
					onPress={this.handleOnPress}
					title="Sign Up"
					color="#841584"
					accessibilityLabel="Sign Up To Airbitz Now"
				/>
			</View>
		);
	}
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
  }
});

export default HomeComponent
