import React, { Component } from 'react'
import { View, Text, Image, TouchableWithoutFeedback } from 'react-native'
import { connect } from 'react-redux'

import { Actions } from 'react-native-router-flux'
import * as Animatable from 'react-native-animatable'
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
  showPassword,
  hidePassword,
  changePasswordValue,
  changePasswordRepeatValue
} from './Password.action'

import { MKTextField } from 'react-native-material-kit'
const unselected = require('../../img/btn_unselected.png')
const selected = require('../../img/Green-check.png')

class Password extends Component {
  handleBack = () => {
    if (this.props.loader.loading === true) {
      return true
    }
    Actions.landing()
    return true
  }
  componentWillMount = () => {
    Actions.refresh({onLeft: this.handleBack})
  }

  checkOneUpper = (validation) => validation.upperCaseChar ? selected : unselected

  checkOneLower = (validation) => validation.lowerCaseChar ? selected : unselected

  checkOneNumber = (validation) => validation.number ? selected : unselected

  checkCharacterLength = (validation) => validation.characterLength ? selected : unselected

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
    this.refs.passwordValidation.transitionTo({height: 90}, 200)
  }

  handlePasswordOnBlur = () => {
    this.refs.passwordValidation.transitionTo({height: 0}, 200)
  }

  handleOnChangePassword = (password) => {
    this.props.dispatch(changePasswordValue(password))
    this.props.dispatch(validate(password))
  }

  handleOnChangePasswordRepeat = (passwordRepeat) => {
    this.props.dispatch(changePasswordRepeatValue(passwordRepeat))
  }

  toggleRevealPassword = () => {
    if (this.props.inputState) {
      this.props.dispatch(hidePassword())
    } else {
      this.props.dispatch(showPassword())
    }
  }

  render () {
    return (
      <Container>
        <View style={[ style.inputView ]}>
          <Text style={style.paragraph}>
            {t('fragment_setup_password_text')}
          </Text>
          <Animatable.View ref='passwordValidation' style={style.passwordValidationContainer}>
            <View style={style.validationOuterContainer}>
              <Text style={[ style.text, style.textLead ]}>{t('activity_signup_password_requirements')}</Text>
              <View style={style.validationContainer}><Image source={this.checkOneUpper(this.props.validation)} style={style.passwordCheckmark} /><Text style={[ style.text ]}>{t('password_rule_no_uppercase')}</Text></View>
              <View style={style.validationContainer}><Image source={this.checkOneLower(this.props.validation)} style={style.passwordCheckmark} /><Text style={[ style.text ]}>{t('password_rule_no_lowercase')}</Text></View>
              <View style={style.validationContainer}><Image source={this.checkOneNumber(this.props.validation)} style={style.passwordCheckmark} /><Text style={[ style.text ]}>{t('password_rule_no_number')}</Text></View>
              <View style={[style.validationContainer, {marginBottom: 5}]}><Image source={this.checkCharacterLength(this.props.validation)} style={style.passwordCheckmark} /><Text style={[ style.text ]}>{t('password_rule_too_short')}</Text></View>
            </View>
          </Animatable.View>

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MKTextField
              selectionColor='#CCCCCC'
              tintColor={this.props.validation.passwordValid ? undefined : '#FF0000'}
              password={!this.props.inputState}
              style={{marginLeft: 30, marginRight: 10, marginVertical: 15}}
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
            <TouchableWithoutFeedback onPress={this.toggleRevealPassword}><Image source={require('../../img/icon_export_view.png')} style={style.passwordEye} /></TouchableWithoutFeedback>
          </View>
          <MKTextField
            password
            style={{marginHorizontal: 30, marginBottom: 15}}
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
  pinNumber: state.pinNumber,
  loader: state.loader

}))(Password)
