import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'

class Review extends Component {

	render() {

		return (
			<View style={style.container}>
				<View style={style.detailsContainer}>
					<View style={style.detailRow}>
						<Text style={[ style.text, style.detailText, style.detailTextLeft ]}>Username:</Text>	
						<Text style={[ style.text, style.detailText, style.detailTextRight ]}>MasterFooFoo</Text>	
					</View>
					<View style={style.detailRow}>
						<Text style={[ style.text, style.detailText, style.detailTextLeft ]}>PIN:</Text>	
						<Text style={[ style.text, style.detailText, style.detailTextRight ]}>7777</Text>	
					</View>
					<View style={style.detailRow}>
						<Text style={[ style.text, style.detailText, style.detailTextLeft ]}>Password:</Text>	
						<Text style={[ style.text, style.detailText, style.detailTextRight ]}>I_am_the_foo</Text>	
					</View>
				</View>
				<View style={style.detailsContainer}>
					<Text style={style.text}> 
						Your Username, password, and pin are known only to you and never transmitted or stored unencrypted
					</Text>
					<Text style={[ style.text, style.warning ]}> 
						Write down and store securely!!
					</Text>
				</View>
				<TouchableHighlight style={style.button} onPress={this.props.onPress}>
					<Text style={style.buttonText}>Show</Text>
				</TouchableHighlight>
			</View>
		)
	}
}

const style = StyleSheet.create({
	container: {
		flex:1,
		backgroundColor: '#222',
		justifyContent: 'center',
		alignItems: 'center'
	},

	detailsContainer: {
		margin: 25
	},

	detailRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},

	detailText: {
		fontSize: 18,
		marginVertical: 3,
		marginHorizontal: 7
	},

	detailTextLeft: {
		textAlign:'right', 
		width:100
	},

	detailTextRight: {
 		textAlign:'left',
		width:200
	},

	text: {
		marginVertical: 10,
		color: "#FFF",
		fontSize: 16	
	},

	warning: {
		color: 'yellow'		
	},

	button: {
		borderStyle: 'solid',
		borderColor: '#FFF',
		borderWidth: 2,
		backgroundColor: 'rgba(0,0,0,0)',
		justifyContent: 'center',
		width: 100,
		height: 60
	},

	buttonText: {
		textAlign: 'center',	
		color: '#FFF',
		fontSize: 22
	}
})

export default Review
