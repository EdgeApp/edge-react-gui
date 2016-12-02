import React, { Component } from 'react'
import { View, Text } from 'react-native'

import style from './style'

export default class Details extends Component {
	render(){
		return (
			<View style={style.detailsContainer}>
				<View style={style.detailRow}>
					<Text style={[ style.text, style.detailText, style.detailTextLeft ]}>Username:</Text>	
					<Text style={[ style.text, style.detailText, style.detailTextRight ]}>{this.props.username}</Text>	
				</View>
				<View style={style.detailRow}>
					<Text style={[ style.text, style.detailText, style.detailTextLeft ]}>PIN:</Text>	
					<Text style={[ style.text, style.detailText, style.detailTextRight ]}>{this.props.pinNumber}</Text>	
				</View>
				<View style={style.detailRow}>
					<Text style={[ style.text, style.detailText, style.detailTextLeft ]}>Password:</Text>	
					<Text style={[ style.text, style.detailText, style.detailTextRight ]}>{this.props.password}</Text>	
				</View>
			</View>
		)
	}
}
