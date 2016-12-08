import { connect } from 'react-redux'
import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'
import { showNextButton, hideNextButton } from './NextButton.action'
import t from '../../lib/LocaleStrings'

class NextButton extends Component {

  componentWillReceiveProps (nextProps) {
    if (nextProps.scene === 'password') {
      if (nextProps.password.length === 0) {
        this.props.dispatch(hideNextButton())
      }

      if (nextProps.password.length !== 0) {
        this.props.dispatch(showNextButton())
      }
    }

    if (nextProps.scene !== 'password') {
      this.props.dispatch(showNextButton())
    }
  }

  render () {
    if (this.props.visible) {
      return (
        <View>
          <TouchableHighlight style={styles.button} onPress={this.props.onPress}>
            <Text style={styles.buttonText}>{t('string_next')}</Text>
          </TouchableHighlight>
        </View>
      )
    }

    if (!this.props.visible) {
      return null
    }
  }

}

const styles = StyleSheet.create({

  button: {
    backgroundColor: 'limegreen',
    height: 60
  },

  buttonText: {
    textAlign: 'center',
    color: '#FFF',
    paddingTop: 10,
    fontSize: 25
  }

})

export default connect(state => ({

  visible: state.nextButtonVisible,
  password: state.password.password,
  scene: state.routes.scene.sceneKey

}))(NextButton)
