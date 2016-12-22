import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import NavigationBar from './SignUpNavigationBar.ui'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Loader from './Loader/Loader.ui'
import { hideWhiteOverlay } from './Landing.action'
class SignUpContainer extends Component {
  componentWillMount () {
    const foo = global.abcContext.listUsernames()
  }

  render () {
    return (
      <View style={style.container}>
        <NavigationBar />
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
  whiteOverlayVisible: state.whiteOverlayVisible

}))(SignUpContainer)
