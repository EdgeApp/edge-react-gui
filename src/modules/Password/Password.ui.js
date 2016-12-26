import React, { Component } from 'react'
import { View, Text, TextInput } from 'react-native'
import { connect } from 'react-redux'

import * as Animatable from 'react-native-animatable'
import Container from '../SignUp.ui'
import Notification from './Notification.ui'
import style from './Password.style'

import { validate } from './PasswordValidation/PasswordValidation.middleware'
import { checkPassword, skipPassword } from './Password.middleware'
import { openLoading } from '../Loader/Loader.action'
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
import PasswordValidation from './PasswordValidation/PasswordValidation.ui'

import { MKTextField } from 'react-native-material-kit'
class Password extends Component {

  handleSubmit = () => {
    this.props.dispatch(openLoading(t('fragment_signup_creating_account')))
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
    console.log('focus')
    this.refs.passwordValidation.transitionTo({height: 90}, 800)
    this.props.dispatch(focusPasswordInput())
  }

  handlePasswordOnBlur = () => {
    this.refs.passwordValidation.transitionTo({height: 0}, 800)
    this.props.dispatch(blurPasswordInput())
  }

  handleOnChangePassword = (password) => {
    this.props.dispatch(changePasswordValue(password))
    this.props.dispatch(validate(password))
  }

  handleOnChangePasswordRepeat = (passwordRepeat) => {
    this.props.dispatch(changePasswordRepeatValue(passwordRepeat))
  }

  render () {
    return (
      <Container>
        <View style={[ style.inputView ]}>
          <Text style={style.paragraph}>
            {t('fragment_setup_password_text')}
          </Text>
          <Animatable.View ref='passwordValidation' style={{position:'absolute',height:0}}>
            <PasswordValidation />
          </Animatable.View>

          <MKTextField
            tintColor={this.props.validation.passwordValid ? undefined : '#FF0000'}
            password={true}
            style={{marginHorizontal: 30,marginVertical: 15}}
            ref='SignupPasswordFirst'
            autoCorrect={false}
            textInputStyle={style.input}
            placeholder={t('activity_signup_password_hint')}
            keyboardType='default'
            secureTextEntry
            onChangeText={this.handleOnChangePassword}
            value={this.props.password}
            onFocus={this.handlePasswordOnFocus}
            onBlur={this.handlePasswordOnBlur}
            returnKeyType='next'
            onSubmitEditing={e => this.refs.SignupPassword.focus()}
          />
          <MKTextField
            password={true}
            style={{marginHorizontal: 30,marginBottom: 15}}
            ref='SignupPassword'
            autoCorrect={false}
            textInputStyle={style.input}
            placeholder={t('activity_signup_password_confirm_hint')}
            keyboardType='default'
            secureTextEntry
            returnKeyType='done'
            blurOnSubmit
            onChangeText={this.handleOnChangePasswordRepeat}
            value={this.props.passwordRepeat}
          />
          <SkipButton onPress={this.handlePasswordNotification} />
          <NextButton onPress={this.handleSubmit} />

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
