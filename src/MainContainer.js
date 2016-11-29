import React, { Component } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { connect } from 'react-redux'

import LoaderOverlay from './Loader/LoaderOverlay'

class MainContainer extends Component {
	render() {

		if(this.props.loading) {
			return (
				<View style={style.main}> 
					<LoaderOverlay>
						{this.props.children}
					</LoaderOverlay>	
				</View>
			)
		}


		if(!this.props.loading) {
			return (
				<View style={style.main}>
					{this.props.children}
				</View>
			)
		}

	}
}

const style = StyleSheet.create({
	main: {
		flex: 1,
		opacity: 5,
		backgroundColor: '#555'
	}
});

export default connect(state => ({
	loading : state.loading
}))( MainContainer )
