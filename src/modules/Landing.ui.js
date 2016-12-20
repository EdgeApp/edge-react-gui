import React, { Component } from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { Button } from 'native-base'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import Disclaimer from './Disclaimer/Disclaimer.ui'
import Loader from './Loader/Loader.ui'
import WarningModal from './WarningModal/WarningModal.ui'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Login from './Login/Login.ui'
import LoginWithPin from './Login/LoginWithPin.ui'
import appTheme from '../../Themes/appTheme'

import abcctx from '../lib/abcContext'

import { acceptDisclaimer } from './Disclaimer/Disclaimer.action'
import { selectUserToLogin, setCachedUsers } from './CachedUsers/CachedUsers.action'
import { openLogin } from './Login/Login.action'
import t from '../lib/LocaleStrings'

import style from './Style'

class HomeComponent extends Component {

  handleOpenLogin = () => {
    this.props.dispatch(openLogin())
  }

  componentWillMount () {
    const dispatch = this.props.dispatch
    abcctx(ctx => {
      const cachedUsers = ctx.listUsernames()
      const lastUser = global.localStorage.getItem('lastUser')

      dispatch(setCachedUsers(cachedUsers))
      if (lastUser) {
        dispatch(selectUserToLogin(lastUser))
      }
      const disclaimerAccepted = global.localStorage.getItem('disclaimerAccepted')
      this.dispatch(acceptDisclaimer(disclaimerAccepted))
    })
  }


  renderViewLoginPassword = () => {
    if (this.props.password) return (<Login />)

    if (!this.props.password) {
      return (
        <View style={style.container}>
          <View style={style.spacer} />
          <View style={style.form}>
            <TouchableOpacity style={[style.button, { backgroundColor: '#80C342' }]} onPress={this.handleOpenLogin}>
              <Text style={style.buttonText}> Sign In </Text>
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

  renderMainComponent = () => {
    if (this.props.pin) return <LoginWithPin />
    if (!this.props.pin) return this.renderViewLoginPassword()
  }

  renderDisclaimerComponent = () => {
    if (this.props.disclaimerAccepted) return null
    else {
      return (<Disclaimer/>)
    }
    // if (global.localStorage) {
    //   const disclaimerAccepted = global.localStorage.getItem('disclaimerAccepted')
    //   if (!disclaimerAccepted) {
    //     return (<Disclaimer />)
    //   } else {
    //     return null
    //   }
    // }
  }

  render () {
    return (
      <Image source={require('../img/background.jpg')} resizeMode='cover' style={style.backgroundImage}>
        <View style={style.logoContainer}>
          <Image source={require('../img/logo.png')} style={style.logoImage} />
        </View>
        { this.renderMainComponent() }
        <Loader />
        <WarningModal />
        <ErrorModal />
        { this.renderDisclaimerComponent() }
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
