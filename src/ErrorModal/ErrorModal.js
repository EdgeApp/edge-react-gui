import React, { Component } from 'react'
import { Text, TouchableHighlight } from 'react-native'
import Modal from 'react-native-modalbox'
import { connect } from 'react-redux'

import { closeErrorModal } from './action'
import style from './style'

class ErrorModal extends Component {

	handleClose = () => {
		this.props.dispatch(closeErrorModal())	
	}

	checkLoading = () => {
		if (this.props.visible === true &&  this.props.loader.loading === false){
			return true	
		}else{
			return false	
		}
	}

	render() {
		console.log(style)
		return (
			<Modal
			    isOpen={this.checkLoading()}
			    position={"center"}
			    style={style.modal}
				animationDuration={200}
				onClosed={this.handleClose}
			>
				<Text style={style.textError}>{this.props.message}</Text>
				<TouchableHighlight onPress={ this.handleClose } >
					<Text style={style.hideModal}>Close</Text>
				</TouchableHighlight>
			</Modal>
		)
	}
}



export default connect( state => ({

	visible: state.errorModal.visible,
	message: state.errorModal.message,
	loader: state.loader

}))(ErrorModal)
