import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import abc from '../lib/abcContext'

import CachedUsers from './CachedUsers/CachedUsers.ui'
import Loader from './Loader/Loader.ui'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Login from './Login/Login.ui'
import LoginWithPin from './Login/LoginWithPin.ui'

import { openLogin, blurUsername } from './Login/Login.action'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { Button } from 'native-base'
import appTheme from '../../Themes/appTheme'
import t from '../lib/LocaleStrings'

import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window')

class Main extends Component {

  componentWillMount() {
    const listUsers = abc.listUsernames() 
  }
  
  handleOpenLogin = () => {
    this.props.dispatch(openLogin())
  }
  containerTouched = (event) => {
    this.props.dispatch(openLogin())
  }
  render () {
    if (this.props.pin) {
      return (
        <View style={styles.main}>
          <LoginWithPin />
        </View>
      )
    }

    if (!this.props.pin) {
      if (this.props.password) {
        return (
          <View style={styles.main} onStartShouldSetResponder={this.containerTouched.bind(this)}>
            <Login />
            <TouchableOpacity style={[ styles.button, { backgroundColor: '#2291CF' }]} onPress={Actions.signup}>
              <Text style={styles.buttonText}>{t('fragment_landing_signup_button')}</Text>
            </TouchableOpacity>
          </View>
        )
      }

      if (!this.props.password) {
        return (
          <View style={styles.main}>
            <TouchableOpacity style={[ styles.button, { backgroundColor: '#80C342' }]} onPress={this.handleOpenLogin}>
              <Text style={styles.buttonText}>{t('fragment_landing_signin_button')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ styles.button, { backgroundColor: '#2291CF' }]} onPress={Actions.signup}>
              <Text style={styles.buttonText}>{t('fragment_landing_signup_button')}</Text>
            </TouchableOpacity>
          </View>
        )
      }
    }
  }

}

class HomeComponent extends Component {

  render () {
    return (
      <Image source={require('../assets/drawable/background.jpg')} resizeMode='cover' style={styles.backgroundImage}>
        <Image source={require('../assets/drawable/logo.png')} style={styles.logoImage} />
        <Main {...this.props} />
        <Loader />
        <ErrorModal />
      </Image>
    )
  }

}

const styles = StyleSheet.create({

  main: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },

  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
    color: '#FFFFFF'
  },

  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
    resizeMode: 'cover',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  logoImage: {
    resizeMode: 'contain',
    width: width * 0.5,
    marginTop: -14

  },

  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.7,
    height: 45,
    marginVertical: 3
  },

  buttonText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    flex: 1
  }

})

export default connect(state => ({

  password: state.login.viewPassword,
  selectedUserToLogin: state.cachedUsers.selectedUserToLogin,
  pin: state.login.viewPIN

}))(HomeComponent)
