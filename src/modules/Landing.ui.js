import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import abcctx from '../lib/abcContext'
import Disclaimer from './Disclaimer/Disclaimer.ui'
import CachedUsers from './CachedUsers/CachedUsers.ui'
import { selectUserToLogin, setCachedUsers } from './CachedUsers/CachedUsers.action'
import Loader from './Loader/Loader.ui'
import WarningModal from './WarningModal/WarningModal.ui'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Login from './Login/Login.ui'
import LoginWithPin from './Login/LoginWithPin.ui'

import { openLogin } from './Login/Login.action'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { Button } from 'native-base'
import appTheme from '../../Themes/appTheme'
import t from '../lib/LocaleStrings'
import style from './Style'

class HomeComponent extends Component {

  componentWillMount () {
    const dispatch = this.props.dispatch
    abcctx(ctx => {
      const cachedUsers = ctx.listUsernames()
      const lastUser = global.localStorage.getItem('lastUser')

      dispatch(setCachedUsers(cachedUsers))
      if (lastUser) {
        dispatch(selectUserToLogin(lastUser))
      }
    })
  }
  handleOpenLogin = () => {
    this.props.dispatch(openLogin())
  }
  render () {
    const viewDisclaimer = () => {
      if (this.props.disclaimerAccepted) return null
      if (global.localStorage) {
        const disclaimerAccepted = global.localStorage.getItem('disclaimerAccepted')

        if (!disclaimerAccepted) {
          return (<Disclaimer />)
        } else {
          return null
        }
      }
    }
    const viewMain = () => {
      if (this.props.pin) {
        return (
          <LoginWithPin />
        )
      }

      if (!this.props.pin) {
        if (this.props.password) {
          return (<Login />)
        }

        if (!this.props.password) {
          return (
            <View style={style.container}>
              <View style={style.spacer} />
              <View style={style.form}>
                <TouchableOpacity style={[style.button, { backgroundColor: '#80C342' }]} onPress={this.handleOpenLogin}>
                  <Text style={style.buttonText}>{t('fragment_landing_signin_button')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ style.button, { backgroundColor: '#2291CF' }]} onPress={Actions.signup}>
                  <Text style={style.buttonText}>{t('fragment_landing_signup_button')}</Text>
                </TouchableOpacity>
              </View>
              <View style={style.spacer} />
            </View>
          )
        }
      }
    }
    return (
      <Image source={require('../assets/drawable/background.jpg')} resizeMode='cover' style={style.backgroundImage}>
        <View style={style.logoContainer}>
          <Image source={require('../assets/drawable/logo.png')} style={style.logoImage} />
        </View>
        {viewMain()}
        <Loader />
        <WarningModal />
        <ErrorModal />
        {viewDisclaimer()}
      </Image>
    )
  }

}

export default connect(state => ({

  password: state.login.viewPassword,
  selectedUserToLogin: state.cachedUsers.selectedUserToLogin,
  pin: state.login.viewPIN,
  disclaimerAccepted: state.disclaimerAccepted

}))(HomeComponent)
