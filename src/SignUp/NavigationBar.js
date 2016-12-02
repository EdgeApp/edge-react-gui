import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'

import PasswordValidation from './Password/PasswordValidation/PasswordValidation'

import { navigatorPush, navigatorPop } from '../Navigator/action'

class NavigationBar extends Component {

	handleOnPress = () => {
		this.props.dispatch(navigatorPop())	
	}

	checkPasswordStateOption = () => {

		if(this.props.passwordState){
			return (
				<PasswordValidation />
			)	
		}else{
			return null	
		}

	}
	
	render() {
		return (
			<View style={[ style.container, this.props.passwordState ? {height: 200} : null ]}>
				<View style={style.navigationBarContainer}>
					<View style={style.navigationContainer}>
						<TouchableHighlight onPress={this.handleOnPress}>
							<Text style={style.text}>Back</Text>
						</TouchableHighlight>
						<Text style={[ style.text, style.title ]}>{this.props.route.title}</Text>
						<Text style={style.text}>     </Text>
					</View>
					{ this.checkPasswordStateOption() }
				</View>
			</View>
		);
	}

}

const style = StyleSheet.create({


	container: {
		height:60,
		backgroundColor: 'limegreen'
	},

	navigationBarContainer: {
		flex:1
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
		fontSize: 20,
		width:50
	},

	title : {
		textAlign: 'center',	
		fontSize: 18,
		flex: 1
	}
});

export default connect( state => ({

	route			: state.route,
	passwordState	: state.password.inputState

}) )(NavigationBar)
