import React, { Component } from 'react'
import { BackAndroid, View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Loader from './Loader/Loader.ui'

import { Actions } from 'react-native-router-flux'
import { fadeWhiteOverlay } from './Landing.action'

class SignUpContainer extends Component {
  componentDidMount = () => {
    let self = this
    BackAndroid.addEventListener('hardwareBackPress', function () {
      if (this.props.loader.loading === true) {
        return true
      }
      switch (self.props.scene) {
        case 'username':
          self.props.dispatch(fadeWhiteOverlay())
          Actions.pop()
          break
        default:
          Actions.pop()
      }
      return true
    })
  }

  render () {
    return (
      <View style={style.container}>
        {this.props.children}
        <Loader />
        <ErrorModal />
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF'
  }

})
export default connect(state => ({
  scene: state.routes.scene.sceneKey,
  loader: state.loader

}))(SignUpContainer)
