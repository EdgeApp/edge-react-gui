import React, { Component } from 'react'
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'

import PasswordValidation from './Password/PasswordValidation/PasswordValidation.ui'

import { Actions } from 'react-native-router-flux'

class NavigationBar extends Component {

  checkPasswordStateOption = () => {
    if (this.props.scene === 'password' && this.props.passwordState) {
      return (
        <PasswordValidation />
      )
    } else {
      return null
    }
  }

  checkPasswordStateStyle = () => {
    if (this.props.scene === 'password' && this.props.passwordState) {
      return {height: 120}
    } else {
      return {height: 60}
    }
  }

  render () {
    return (
      <View style={[ style.container, this.checkPasswordStateStyle() ]}>
        <View style={style.navigationBarContainer}>
          <View style={style.navigationContainer}>
            <TouchableHighlight onPress={Actions.pop}>
              <Text style={style.text}>Back</Text>
            </TouchableHighlight>
            <Text style={[ style.text, style.title ]} />
            <Text style={style.text} />
          </View>
          { this.checkPasswordStateOption() }
        </View>
      </View>
    )
  }

}

const style = StyleSheet.create({

  container: {
    backgroundColor: '#2291CF'
  },

  navigationBarContainer: {
    flex: 1
  },

  navigationContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2291CF'
  },

  text: {
    marginLeft: 10,
    marginRight: 10,
    color: '#FFF',
    fontSize: 20,
    width: 50
  },

  title: {
    textAlign: 'center',
    fontSize: 18,
    flex: 1
  }
})

export default connect(state => ({

  route: state.route,
  passwordState: state.password.inputState,
  scene: state.routes.scene.sceneKey

}))(NavigationBar)
