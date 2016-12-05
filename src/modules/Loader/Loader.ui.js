import React, { Component } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import Modal from 'react-native-modalbox'
import { connect } from 'react-redux'

import style from './Loader.style'

class Loader extends Component {

	checkLoading = () => {
		if (this.props.loader.loading === true &&  this.props.errorModal.visible === false){
			return true	
		}else{
			return false	
		}
	}

	render() {
		return (
			<Modal
			    isOpen={ this.checkLoading() }
				swipeToClose={false}
			    position={"center"}
			    style={style.modal}
			    animationDuration={0}
				backdropPressToClose={false}
				onClosed={this.handleClose}
			>
				<Text style={style.loadingMessage}>{ this.props.loader.message }</Text>
				<ActivityIndicator
					animating={true}
					color="#FFF"
					size={70}
				/>
			</Modal>
		)

	}
}


export default connect( state => ({

	loader		: state.loader,
	errorModal	: state.errorModal

}) )(Loader)
