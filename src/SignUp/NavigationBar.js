import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'

class NavigationBar extends Component {

	render() {
		return (
			<View style={style.container}>
				<View style={style.navigationContainer}>
					<TouchableHighlight onPress={this.props.onPress}>
						<Text style={style.text}>Back</Text>
					</TouchableHighlight>
					<Text style={[ style.text, style.title ]}>Awesome Title</Text>
					<Text style={style.text}>     </Text>
				</View>
			</View>
		);
	}

}

const style = StyleSheet.create({


	container: {
		height:60	
	},

	navigationContainer: {
		flex:1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'limegreen'
	},

	text: {
		marginLeft: 10,
		marginRight: 10,
		color: "#FFF",	
		fontSize: 20
	},

	title : {
		textAlign: 'center',	
		fontSize: 18,
		flex: 1
	}
});

export default NavigationBar
