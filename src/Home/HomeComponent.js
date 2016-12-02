import { connect } from 'react-redux'
import React, { Component } from 'react'
import { Text, Button, View, StyleSheet } from 'react-native'

import { navigatorPush, navigatorPop } from '../Navigator/action'

import LoaderOverlay from '../Loader/LoaderOverlay'
class HomeComponent extends Component {
	
	handleOnPress  = () => {
		this.props.dispatch(navigatorPush())
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

export default connect()(HomeComponent)
