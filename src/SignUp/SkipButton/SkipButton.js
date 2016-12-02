import { connect } from 'react-redux'
import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'

class SkipButton extends Component {

	render() {

		if(this.props.visible) {
			return (
				<View>
					<TouchableHighlight style={styles.button} onPress={this.props.onPress}>
						<Text style={styles.buttonText}>Skip</Text>
					</TouchableHighlight>
				</View>
			);
		}

		if(!this.props.visible) {
			return null	
		}

	}

}

const styles = StyleSheet.create({

	button: {
		backgroundColor: 'limegreen',
		height: 60
	},

	buttonText: {
		textAlign: 'center',	
		color: '#FFF',
		paddingTop:10,
		fontSize: 25
	}

});

export default connect( state => ({
	
	visible : state.skipButtonVisible

}) )(SkipButton)
