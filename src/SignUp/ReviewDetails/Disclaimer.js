import React, { Component } from 'react'
import { View, Text } from 'react-native'

import style from './style'

export default class Details extends Component {
	render(){
		return (
			<View style={style.detailsContainer}>
				<Text style={style.text}> 
					Your Username, password, and pin are known only to you and never transmitted or stored unencrypted
				</Text>
				<Text style={[ style.text, style.warning ]}> 
					Write down and store securely!!
				</Text>
			</View>
		)
	}
}
