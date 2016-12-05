import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'

import NavigationBar from './NavigationBar'
import ErrorModal from '../ErrorModal/ErrorModal'
import Loader from '../Loader/LoaderOverlay'
import NextButton from './NextButton/NextButton'
import SkipButton from './SkipButton/SkipButton'

class SignUpContainer extends Component {

  render () {
    return (
      <View style={style.container}>
        <NavigationBar />
        {this.props.children}
        <SkipButton onPress={this.props.handleSkip} />
        <NextButton onPress={this.props.handleSubmit} />
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
