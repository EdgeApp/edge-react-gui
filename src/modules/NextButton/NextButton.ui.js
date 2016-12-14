import { connect } from 'react-redux'
import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
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

  checkScene = () => {
    switch (this.props.scene) {
      case 'review':
        return t('string_finish')

      default:
        return t('string_next')
    }
  }

  render () {
    if (this.props.visible) {
      return (
        <View>
          <TouchableOpacity style={styles.button} onPress={this.props.onPress}>
            <Text style={styles.buttonText}>{ this.checkScene() }</Text>
          </TouchableOpacity>
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
    backgroundColor: '#80C342',
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
