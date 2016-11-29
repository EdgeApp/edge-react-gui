import React, { Component } from 'react'
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native'
import Modal from 'react-native-modalbox'
import { connect } from 'react-redux'

class LoaderOverlay extends Component {

	checkLoading = () => {
		if (this.props.loading === true &&  this.props.errorModal.visible === false){
			return true	
		}else{
			return false	
		}
	}

	render() {
		return (
			<Modal
			    isOpen={this.checkLoading()}
				swipeToClose={false}
			    position={"center"}
			    style={style.modal}
			    animationDuration={0}
				onClosed={this.handleClose}
			>
				<ActivityIndicator
					animating={true}
					style={style.loader}
					color="#FFF"
					size={70}
				/>
			</Modal>
		)

	}
}

const style = StyleSheet.create({

	modal: {
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.5,
		backgroundColor: "#000"
	},

	loader: {
		flex:1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	}
});

export default connect( state => ({
	loading: state.loading,
	errorModal: state.errorModal
}) )(LoaderOverlay)
