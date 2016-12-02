import { connect } from 'react-redux'
import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'
import { showSkipButton, hideSkipButton } from './action'

class SkipButton extends Component {

	componentWillReceiveProps(nextProps){
		if(this.props.route.index !== nextProps.route.index) {

			if(nextProps.route.screen === "createPassword"){
				this.props.dispatch(showSkipButton())
			}

		}
	}

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
	
	visible : state.skipButtonVisible,
	route	: state.route

}) )(SkipButton)
