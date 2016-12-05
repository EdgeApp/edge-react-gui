import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'

import Details from './Details'
import Disclaimer from './Disclaimer'
import { showSignInDetails, hideSignInDetails  } from './action'
import t from "../../lib/LocaleStrings"
import style from './style'

class Review extends Component {

	handleHideDetails = () => {
		if(this.props.review) {
			this.props.dispatch(hideSignInDetails())
		}	
	}

	handleShowDetails = () => {
		if(!this.props.review) {
			this.props.dispatch(showSignInDetails())
		}	
	}

	render() {

		if(this.props.review) {
			return (
				<View style={style.container}>
					<Details username={this.props.username} pinNumber={this.props.pinNumber} password={this.props.password}/>	
					<TouchableHighlight style={style.button} onPress={this.handleHideDetails}>
						<Text style={style.buttonText}>{t('fragment_setup_writeitdown_hide')}</Text>
					</TouchableHighlight>
				</View>
			)	

		}	

		if(!this.props.review){
			return (
				<View style={style.container}>
					<Disclaimer />
					<TouchableHighlight style={style.button} onPress={this.handleShowDetails}>
						<Text style={style.buttonText}>{t('fragment_setup_writeitdown_show')}</Text>
					</TouchableHighlight>
				</View>
			)	
		}

	}
}

export default connect( state => ({
	
	username	: state.username,
	pinNumber	: state.pinNumber,
	password	: state.password.password,
	review		: state.reviewDetails

}) )(Review)
