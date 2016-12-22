import React, { Component } from 'react'
import * as Animatable from 'react-native-animatable'
import { Animated, View, Text, Image, TouchableOpacity } from 'react-native'
import { Button } from 'native-base'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import Disclaimer from './Disclaimer/Disclaimer.ui'
import Loader from './Loader/Loader.ui'
import WarningModal from './WarningModal/WarningModal.ui'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Login from './Login/Login.ui'
import LoginWithPin from './Login/LoginWithPin.ui'
import TemplateView from './tpl/View.ui'
import abcctx from '../lib/abcContext'

import { showWhiteOverlay, hideWhiteOverlay } from './Landing.action'

import { acceptDisclaimer, showDisclaimer } from './Disclaimer/Disclaimer.action'
import { selectUserToLogin, setCachedUsers } from './CachedUsers/CachedUsers.action'
import { openLogin } from './Login/Login.action'
import t from '../lib/LocaleStrings'

import style from './Style'

global.randomBytes = require('react-native-randombytes').randomBytes
// synchronous API
// uses SJCL
var rand = randomBytes(4)
console.log("SYNC RANDOM BYTES",rand.toString('hex'))

// asynchronous API
// uses iOS-side SecRandomCopyBytes
randomBytes(4, (err, bytes) => {
  console.log("RANDOM BYTES",bytes.toString('hex'))
})

class HomeComponent extends TemplateView {

  handleOpenLogin = () => {
    this.props.dispatch(openLogin())
  }

  handleOpenSignup = () => {
    this.props.dispatch(showWhiteOverlay())
  }
  componentDidUpdate() {
    if(this.props.whiteOverlayVisible) {
      this.refs.whiteOverlay.fadeIn(400).then((endState) => {
        Actions.signup()
      })
      var self = this
      setTimeout(function() {
            self.props.dispatch(hideWhiteOverlay())
      },3000)
    }
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
      if(!disclaimerAccepted) dispatch(showDisclaimer())
    })
  }

  renderWhiteTransition () {
    if(this.props.whiteOverlayVisible) {
      return (<Animatable.View ref='whiteOverlay' style={style.whiteTransitionFade}></Animatable.View>)
    } else {
      return null
    }
  }
  renderViewLoginPassword = () => {
    if (this.props.password) return (<Login />)

    if (!this.props.password) {
      return (
        <View style={style.container}>
          <View style={style.spacer} />
          <View style={style.form}>
            <Text style={style.textTitle}>{t('fragment_landing_detail_text')}</Text>
            <TouchableOpacity style={[style.button, { backgroundColor: '#80C342' }]} onPress={this.handleOpenLogin}>
              <Text style={style.buttonText}> Sign In </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ style.button, { backgroundColor: '#2291CF' }]} onPress={this.handleOpenSignup}>
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
      return (<Disclaimer />)
    }
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
        { this.renderWhiteTransition() }
      </Image>
    )
  }

}

export default connect(state => ({

  password: state.login.viewPassword,
  selectedUserToLogin: state.cachedUsers.selectedUserToLogin,
  pin: state.login.viewPIN,
  disclaimerAccepted: state.disclaimerAccepted,
  whiteOverlayVisible: state.whiteOverlayVisible

}))(HomeComponent)
