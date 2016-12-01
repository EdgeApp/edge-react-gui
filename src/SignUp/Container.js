import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'

import NextButton from './NextButton'
import NavigationBar from './NavigationBar'
import ErrorModal from '../ErrorModal/ErrorModal'
import Loader from '../Loader/LoaderOverlay'

class SignUpContainer extends Component {

	handleBack  = () => {
		this.props.navigator.pop()
	}

	render() {

		return (
			<View style={style.container}>
				<NavigationBar onPress={this.handleBack}/>
				{this.props.children}
				<NextButton onPress={this.props.handleSubmit} />
				<Loader />
				<ErrorModal />
			</View>
		)
	}
}

const style = StyleSheet.create({
	container: {
		flex:1,
		backgroundColor: '#F5FCFF'
	},

})

export default SignUpContainer
