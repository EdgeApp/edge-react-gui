import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'
import Dimensions from 'Dimensions'

const {height, width} = Dimensions.get('window');

class Details extends Component {
	render(){
		return (
			<View style={style.detailsContainer}>
				<View style={style.detailRow}>
					<Text style={[ style.text, style.detailText, style.detailTextLeft ]}>Username:</Text>	
					<Text style={[ style.text, style.detailText, style.detailTextRight ]}>MasterFofofofoafaklfnalsgnlksagoa</Text>	
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
		)
	}
}

class Disclaimer extends Component {
	render(){
		return(
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

class Review extends Component {

	constructor(props) {
		super(props)
		this.state = {
			showDetails: false
		}
	}

	handleHideDetails = () => {
		if(this.state.showDetails) {
			this.setState({
				showDetails: false	
			})
		}	
	}

	handleShowDetails = () => {
		if(!this.state.showDetails) {
			this.setState({
				showDetails: true	
			})
		}	
	}

	render() {

		if(this.state.showDetails) {
			return (
				<View style={style.container}>
					<Details />	
					<TouchableHighlight style={style.button} onPress={this.handleHideDetails}>
						<Text style={style.buttonText}>Hide</Text>
					</TouchableHighlight>
				</View>
			)	

		}	

		if(!this.state.showDetails){
			return (
				<View style={style.container}>
					<Disclaimer />
					<TouchableHighlight style={style.button} onPress={this.handleShowDetails}>
						<Text style={style.buttonText}>Show</Text>
					</TouchableHighlight>
				</View>
			)	
		}

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
		width: width * 1 / 3
	},

	detailTextRight: {
 		textAlign:'left',
		paddingRight: 30,
		width: width * 2 / 3
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
