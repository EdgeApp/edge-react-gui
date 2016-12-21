import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'

import NavigationBar from './SignUpNavigationBar.ui'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Loader from './Loader/Loader.ui'

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

export default SignUpContainer
