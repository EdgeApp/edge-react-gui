import React, { Component } from 'react'
import { Text, TouchableHighlight, StyleSheet } from 'react-native'
import Modal from 'react-native-modalbox'

import { connect } from 'react-redux'
import { closeErrorModal } from './action'

class ErrorModal extends Component {

	handleClose = () => {
		this.props.dispatch(closeErrorModal())	
	}

	checkLoading = () => {
		if (this.props.visible == true &&  this.props.loading == false){
			return true	
		}else{
			return false	
		}
	}

	render() {
		return (
			<Modal
			  isOpen={this.checkLoading()}
			  position={"center"}
			  style={style.modal}
			  animationDuration={400}
				onClosed={this.handleClose}
			>
				<Text style={style.textError}>{this.props.message}</Text>
				<TouchableHighlight onPress={ this.handleClose } >
					<Text style={style.hideModal}>Hide Modal</Text>
				</TouchableHighlight>
			</Modal>
		)
	}
}

const style = StyleSheet.create({

	modal: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 150,
		padding:10,
		width: 300
	},

	textError: {
		fontSize: 18,
		textAlign: "center",
		marginBottom:10
	},

	hideModal: {
		fontSize: 16,
		color: "skyblue",
		textAlign: "center",
	}
})


export default connect( state => ({
	visible: state.errorModal.visible,
	message: state.errorModal.message,
	loading: state.loading
}))(ErrorModal)
