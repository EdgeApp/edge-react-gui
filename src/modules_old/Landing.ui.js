import React from 'react'
import * as Animatable from 'react-native-animatable'
import { Image } from 'react-native'
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
import { closeUserList } from './Login/Login.action'

import { removeWhiteOverlay, showWhiteOverlayComplete } from './Landing.action'

import { showDisclaimer } from './Disclaimer/Disclaimer.action'
import { selectUserToLogin, setCachedUsers } from './CachedUsers/CachedUsers.action'

import style from './Style'
import { setTheme } from 'react-native-material-kit'
// customize the material design theme
setTheme({
  primaryColor: '#87CEEB',
  primaryColorRGB: '#87CEEB',
  accentColor: '#FF0000'
})

global.randomBytes = require('react-native-randombytes').randomBytes
// synchronous API
// uses SJCL
// var rand = global.randomBytes(4)
// console.log('SYNC RANDOM BYTES', rand, rand.toString('hex'))

class HomeComponent extends TemplateView {

  componentDidUpdate (prevProps) {
    let self = this
    if (this.props.gainedFocus && this.props.whiteOverlayVisible) {
      this.refs.whiteOverlay.fadeOut(200).then(endState => {
        self.props.dispatch(removeWhiteOverlay())
      })
    } else if (this.props.lostFocus) {
      this.refs.whiteOverlay.fadeIn(200).then(endState => {
        self.props.dispatch(showWhiteOverlayComplete())
      }).catch(e => {
        console.error(e)
      })
      setTimeout(() => {
        Actions.signup()
      }, 100)
    }
  }

  componentWillMount () {
    super.componentWillMount()
    const dispatch = this.props.dispatch
    abcctx(ctx => {
      const cachedUsers = ctx.listUsernames()
      const lastUser = global.localStorage.getItem('lastUser')

      dispatch(setCachedUsers(cachedUsers))
      if (lastUser) {
        dispatch(selectUserToLogin(lastUser))
      }
      const disclaimerAccepted = global.localStorage.getItem('disclaimerAccepted')
      if (!disclaimerAccepted) dispatch(showDisclaimer())
    })
  }

  renderWhiteTransition () {
    if (this.props.whiteOverlayVisible) {
      return (<Animatable.View ref='whiteOverlay' style={style.whiteTransitionFade} />)
    } else {
      return null
    }
  }

  renderMainComponent = () => {
    if (this.props.pin) return <LoginWithPin ref='loginView' parent={this} />
    if (!this.props.pin) return <Login ref='loginView' parent={this} />
  }
  handleViewPress = () => {
    this.props.dispatch(closeUserList())
  }

  renderDisclaimerComponent = () => {
    if (this.props.disclaimerAccepted) return null
    else {
      return (<Disclaimer />)
    }
  }

  render () {
    return (
      <Image onStartShouldSetResponder={this.handleViewPress} source={require('../img/background.jpg')} resizeMode='cover' style={style.backgroundImage}>
        <Animatable.View ref='logoContainer' onStartShouldSetResponder={this.handleViewPress} style={style.logoContainer}>
          <Image source={require('../img/logo.png')} style={style.logoImage} />
        </Animatable.View>
        {this.renderMainComponent()}
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

  selectedUserToLogin: state.cachedUsers.selectedUserToLogin,
  pin: state.login.viewPIN,
  disclaimerAccepted: state.landing.disclaimerAccepted,
  whiteOverlayVisible: state.landing.whiteOverlayVisible,
  lostFocus: state.landing.lostFocus,
  gainedFocus: state.landing.gainedFocus

}))(HomeComponent)
