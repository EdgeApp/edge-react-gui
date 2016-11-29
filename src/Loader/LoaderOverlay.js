import React, { Component } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import Modal from 'react-native-modalbox'
import Dimensions from 'Dimensions'
import { connect } from 'react-redux'

const { width, height } = Dimensions.get('window');

class LoaderOverlay extends Component {
	render() {
		if(this.props.loading == true && this.props.errorModal.visible == false){
			return(
				<View style={style.overlay}> 
					<ActivityIndicator
						animating={true}
						style={style.loader}
						color="#DDD"
						size={70}
					/>
				</View>
			)
		}else{
			return null	
		}

	}
}

const style = StyleSheet.create({

	loader: {
		flex:1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	},

	overlay: {
		flex: 1,
		height: height,
		width: width,
		position: 'absolute',
		left: 0,
		top: 0,
		backgroundColor: '#000',
		opacity: 0.8,
		zIndex: 100
	}
});

export default connect( state => ({
	loading: state.loading,
	errorModal: state.errorModal
}) )(LoaderOverlay)
