import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'

import HomeComponent from './HomeComponent'

class HomeContainer extends Component {
	render() {
		return (
			<View style={styles.home}> 
				<HomeComponent navigator={this.props.navigator}/>	
			</View>
		)
	}
}

const styles = StyleSheet.create({
	home: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingBottom: 100,
		backgroundColor: '#F5FCFF'
	}
});

export default HomeContainer
