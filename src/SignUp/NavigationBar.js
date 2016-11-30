import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'

class NavigationBar extends Component {

	render() {
		return (
			<View style={style.container}>
				<TouchableHighlight onPress={this.props.onPress}>
					<Text>Back</Text>
				</TouchableHighlight>
				<Text>Awesome Title</Text>
			</View>
		);
	}

}

const styles = StyleSheet.create({

	container: {
		flex:1,
		flexDirection: 'row',
		backgroundColor: 'limegreen'
	},

	title : {
		flex: 1,	
		color: "#FFF"
	}

});

export default NavigationBar
