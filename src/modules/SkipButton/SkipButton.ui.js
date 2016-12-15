import { connect } from 'react-redux'
import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'
import { showSkipButton, hideSkipButton } from './SkipButton.action'
import t from '../../lib/LocaleStrings'

class SkipButton extends Component {

  render () {

    if (this.props.scene === 'password') {
      return (
        <View>
          <TouchableHighlight style={[ styles.button, this.props.password.length !== 0 ? {backgroundColor: 'rgba(0,0,0,0)'} : null ]} onPress={this.props.onPress}>
            <Text style={[ styles.buttonText, this.props.password.length !== 0 ? {color: '#000'} : null ]}>{t('string_skip')}</Text>
          </TouchableHighlight>
        </View>
      )
    }

    if (this.props.scene !== 'password') {
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

  password: state.password.password,
  visible: state.skipButtonVisible,
  scene: state.routes.scene.sceneKey,
  foo: state.routes

}))(SkipButton)
