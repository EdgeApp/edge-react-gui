import React, { Component } from 'react'
import { View, Text, TextInput } from 'react-native'
import { connect } from 'react-redux'

import Container from '../SignUp.ui'
import Notification from './Notification.ui'
import style from './Password.style'

import { validate } from './PasswordValidation/PasswordValidation.middleware'
import { checkPassword, skipPassword } from './Password.middleware'

import NextButton from '../NextButton/NextButton.ui'
import SkipButton from '../SkipButton/SkipButton.ui'
import t from '../../lib/LocaleStrings'
import {
  passwordNotificationShow,
  focusPasswordInput,
  blurPasswordInput,
  changePasswordValue,
  changePasswordRepeatValue
} from './Password.action'

class Password extends Component {

  handleSubmit = () => {
    this.props.dispatch(
      checkPassword(
        this.props.password,
        this.props.passwordRepeat,
        this.props.validation,
        this.props.username,
        this.props.pinNumber
      )
    )
  }

  handlePasswordNotification = () => {
    this.refs.SignupPasswordFirst.blur()
    this.refs.SignupPassword.blur()
    this.props.dispatch(passwordNotificationShow())
  }

  handleSkipPassword = () => {
    this.props.dispatch(skipPassword(this.props.username, this.props.pinNumber))
  }

  handlePasswordOnFocus = () => {
    this.props.dispatch(focusPasswordInput())
  }

  handlePasswordOnBlur = () => {
    this.props.dispatch(blurPasswordInput())
  }

  handleOnChangePassword = (password) => {
    this.props.dispatch(changePasswordValue(password))
    this.props.dispatch(validate(password))
  }

  handleOnChangePasswordRepeat = (passwordRepeat) => {
    this.props.dispatch(changePasswordRepeatValue(passwordRepeat))
  }

  checkPasswordInputState = () => this.props.inputState ? { marginTop: 10 } : null

  render () {
    return (
      <Container>
        <View style={[ style.inputView, this.checkPasswordInputState() ]}>
          <Text style={style.paragraph}>
            {t('fragment_setup_password_text')}
          </Text>
          <TextInput
            ref='SignupPasswordFirst'
            autoCorrect={false}
            style={style.input}
            placeholder={t('activity_signup_password_hint')}
            keyboardType='default'
            secureTextEntry
            autoFocus
            onChangeText={this.handleOnChangePassword}
            value={this.props.password}
            onFocus={this.handlePasswordOnFocus}
            onBlur={this.handlePasswordOnBlur}
            returnKeyType='next'
            onSubmitEditing={e => this.refs.SignupPassword.focus()}
          />
          <TextInput
            ref='SignupPassword'
            autoCorrect={false}
            style={style.input}
            placeholder={t('activity_signup_password_confirm_hint')}
            keyboardType='default'
            secureTextEntry
            returnKeyType='done'
            onChangeText={this.handleOnChangePasswordRepeat}
            onSubmitEditing={() => { this.handleSubmit() }}
            value={this.props.passwordRepeat}
          />
          <SkipButton onPress={() => { this.handlePasswordNotification() }} />
          <NextButton onPress={() => { this.handleSubmit() }} />

        </View>
        <Notification handleSubmit={this.handleSkipPassword} />
      </Container>
    )
  }
}

export default connect(state => ({

  inputState: state.password.inputState,
  password: state.password.password,
  passwordRepeat: state.password.passwordRepeat,
  validation: state.password.validation,
  username: state.username,
  pinNumber: state.pinNumber

}))(Password)
