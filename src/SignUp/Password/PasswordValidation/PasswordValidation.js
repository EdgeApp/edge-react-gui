import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

class PasswordRequirement extends Component {

	checkOneUpper = () => this.props.password.match(/[A-Z]/) != null ? { color: 'blue' } : null

	checkOneLower = () => this.props.password.match(/[a-z]/) != null ? { color: 'blue' } : null;

	checkOneNumber = () => this.props.password.match(/\d/) != null ? { color: 'blue' } : null;

	checkCharacterLength = () => this.props.password.length >= 10 ? { color: 'blue' } : null;
	render() {
		return (
			<View style={style.container}>
				<Text style={[ style.text, style.textLead ]}>Password Requirements</Text>
				<Text style={[ style.text, this.checkOneUpper() ]}>   -   Must have at least one upper case letter</Text>
				<Text style={[ style.text, this.checkOneLower() ]}>   -   Must have at least one lower case letter</Text>
				<Text style={[ style.text, this.checkOneNumber() ]}>   -   Must have at least one number</Text>
				<Text style={[ style.text, this.checkCharacterLength() ]}>   -   Must have at least 10 characters</Text>
			</View>
		);
	}

}

const style = StyleSheet.create({

	container: {
		flex:3,
		marginHorizontal:10
	},

	text: {
		color: "#FFF",	
		fontSize: 14,
	},

	textLead: {
		marginTop:5,
		marginBottom:5,
		fontSize: 18,
		fontWeight: 'bold'
	},

});

export default connect( state => ({
	password: state.password.password
}) )(PasswordRequirement)
