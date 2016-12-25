import React, { Component } from 'react'
import { Platform, ActivityIndicator, Text } from 'react-native'
import Modal from 'react-native-modalbox'
import { connect } from 'react-redux'

import style from '../Style'

class Loader extends Component {

  checkLoading = () => {
    if (this.props.loader.loading === true && this.props.errorModal.visible === false && this.props.loader.style === 'grey') {
      return true
    } else {
      return false
    }
  }

  render () {
    return (
      <Modal
        isOpen={this.checkLoading()}
        swipeToClose={false}
        position={'center'}
        style={style.loadingModal}
        animationDuration={0}
        backdropPressToClose={false}
      >
        <Text style={style.loadingMessage}>{ this.props.loader.message }</Text>
        <ActivityIndicator
          animating
          color='#FFF'
          size={Platform.OS === 'ios' ? 1 : 70}
        />
      </Modal>
    )
  }
}

export default connect(state => ({

  loader: state.loader,
  errorModal: state.errorModal

}))(Loader)
