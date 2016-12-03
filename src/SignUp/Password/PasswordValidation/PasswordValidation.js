import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

class PasswordRequirement extends Component {

	checkOneUpper = (validation) => validation.upperCaseChar ? { color: 'blue' } : null

	checkOneLower = (validation) => validation.lowerCaseChar ? { color: 'blue' } : null

	checkOneNumber = (validation) => validation.number ? { color: 'blue' } : null

	checkCharacterLength = (validation) => validation.characterLength ? { color: 'blue' } : null

	render() {
		return (
			<View style={style.container}>
				<Text style={[ style.text, style.textLead ]}>Password Requirements</Text>
				<Text style={[ style.text, this.checkOneUpper(this.props.validation) ]}>   -   Must have at least one upper case letter</Text>
				<Text style={[ style.text, this.checkOneLower(this.props.validation) ]}>   -   Must have at least one lower case letter</Text>
				<Text style={[ style.text, this.checkOneNumber(this.props.validation) ]}>   -   Must have at least one number</Text>
				<Text style={[ style.text, this.checkCharacterLength(this.props.validation) ]}>   -   Must have at least 10 characters</Text>
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
	password: state.password.password,
	validation : state.password.validation
}) )(PasswordRequirement)
