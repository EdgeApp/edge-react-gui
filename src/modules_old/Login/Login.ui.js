import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Animatable from 'react-native-animatable'
import { openLogin, loginUsername, loginPassword, openUserList, closeUserList } from './Login.action'
import { loginWithPassword } from './Login.middleware'

import { View, Text, TouchableOpacity, Keyboard } from 'react-native'

import TemplateTextInput from '../tpl/TextInput.ui'
import t from '../../lib/LocaleStrings'
import CachedUsers from '../CachedUsers/CachedUsers.ui'
import style from '../Style'
import { showWhiteOverlay } from '../Landing.action'

class Login extends Component {

  submit = () => {
    if (this.props.viewPassword) {
      this.refs.loginUsername.blur()
      this.refs.password.blur()
      this.props.dispatch(loginWithPassword(this.props.username, this.props.password))
    } else {
      this.props.dispatch(openLogin())
      this.refs.fieldsView.transitionTo({opacity: 1, height: 90}, 200)
      this.refs.fieldsBelowView.transitionTo({height: 0}, 200)
    }
  }

  handleSignup = () => {
    this.props.dispatch(showWhiteOverlay())
  }
  changeUsername = (username) => {
    this.props.dispatch(loginUsername(username))
  }

  changePassword = (password) => {
    this.props.dispatch(loginPassword(password))
  }
  usernameFocused = () => {
    this.showCachedUsers()
    this.refs.titleText.transitionTo({height: 0}, 200)
    this.props.parent.refs.logoContainer.transitionTo({flex: 0.1}, 200)
  }
  passwordFocused = () => {
    this.hideCachedUsers()
    this.refs.titleText.transitionTo({height: 0}, 200)
    this.props.parent.refs.logoContainer.transitionTo({flex: 0.1}, 200)
  }

  showCachedUsers = () => {
    this.props.dispatch(openUserList())
  }

  hideCachedUsers = () => {
    this.props.dispatch(closeUserList())
  }
  keyboardDidShow = () => {

  }
  keyboardDidHide = () => {
    this.props.dispatch(closeUserList())
  }
  componentWillMount () {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow.bind(this))
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide.bind(this))
  }

  componentWillUnmount () {
    this.keyboardDidShowListener.remove()
    this.keyboardDidHideListener.remove()
  }

  renderWhiteTransition () {
    if (this.props.whiteOverlayVisible) {
      return (<Animatable.View ref='whiteOverlay' style={style.whiteTransitionFade} />)
    } else {
      return null
    }
  }
  handleViewPress () {
    this.props.dispatch(closeUserList())
  }
  render () {
    const cUsers = () => {
      if (this.props.showCachedUsers) {
        return (<CachedUsers blurField={this.refs.loginUsername} />)
      } else {
        return null
      }
    }
    let heightBelowView = 90
    let heightFieldsView = 0
    let opacityFieldsView = 0
    if (this.props.viewPassword) {
      heightBelowView = 0
      heightFieldsView = 90
      opacityFieldsView = 1
    }

    return (
      <View style={style.container}>
        <View style={style.spacer} />
        <View style={style.form}>
          <Animatable.View ref='titleText' style={{height: 40}}>
            <Animatable.Text style={style.textTitle}>{t('fragment_landing_detail_text')}</Animatable.Text>
          </Animatable.View>
          <Animatable.View ref='fieldsView' style={[style.fieldsView, {opacity: opacityFieldsView, height: heightFieldsView}]}>
            <TemplateTextInput
              borderType='underline'
              tintColor='#FFFFFF'
              inputGroupStyle={style.inputGroup}
              ref='loginUsername'
              placeholder={t('fragment_landing_username_hint')}
              style={style.input}
              onChangeText={this.changeUsername}
              value={this.props.username}
              returnKeyType={'next'}
              onSubmitEditing={e => this.refs.password.focus()}
              selectTextOnFocus
              onFocus={this.usernameFocused}
              autoCorrect={false}
        />

            <TemplateTextInput
              borderType='underline'
              tintColor='#FFFFFF'
              inputGroupStyle={style.inputGroup}
              ref='password'
              onFocus={this.passwordFocused}
              placeholder={t('fragment_landing_password_hint')}
              style={style.input}
              secureTextEntry
              onChangeText={this.changePassword}
              value={this.props.password}
              blurOnSubmit
              selectTextOnFocus
              autoCorrect={false}
        />
          </Animatable.View>
          <TouchableOpacity style={style.button} onPress={this.submit}>
            <Text style={style.buttonText}> Sign In </Text>
          </TouchableOpacity>
          <Animatable.View ref='fieldsBelowView' style={[{height: heightBelowView}]} />

          <TouchableOpacity style={[style.button, { backgroundColor: '#2291CF' }]} onPress={this.handleSignup}>
            <Text style={style.buttonText}>{t('fragment_landing_signup_button')}</Text>
          </TouchableOpacity>

        </View>
        <View style={style.spacer} />
        {cUsers()}
      </View>
    )
  }
}

export default connect(state => ({

  username: state.login.username,
  password: state.login.password,
  viewPassword: state.login.viewPassword,
  whiteOverlayVisible: state.whiteOverlayVisible,
  showCachedUsers: state.login.showCachedUsers,
  pin: state.login.pin

}))(Login)
