import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Actions } from 'react-native-router-flux'
import { loginUsername, loginPassword, openUserList, closeUserList } from './Login.action'
import { loginWithPassword } from './Login.middleware'
import { View, Text, Image, StyleSheet, TouchableOpacity, Keyboard } from 'react-native'
import { InputGroup, Input, Button } from 'native-base'

import t from '../../lib/LocaleStrings'
import CachedUsers from '../CachedUsers/CachedUsers.ui'
import style from '../Style'
class Login extends Component {

  submit = () => {
    this.refs.loginUsername._textInput.blur()
    this.refs.password._textInput.blur()
    this.props.dispatch(loginWithPassword(this.props.username, this.props.password))
  }

  changeUsername = (username) => {
    this.props.dispatch(loginUsername(username))
  }

  changePassword = (password) => {
    this.props.dispatch(loginPassword(password))
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
  render () {
    const cUsers = () => {
      if (this.props.showCachedUsers) {
        return (<CachedUsers blurField={this.refs.loginUsername} />)
      } else {
        return null
      }
    }

    return (
      <View style={style.container}>
        <View style={style.spacer} />
        <View style={style.form}>

          <InputGroup borderType='regular' style={style.inputGroup} >
            <Input
              ref='loginUsername'
              placeholder={t('fragment_landing_username_hint')}
              style={style.input}
              onChangeText={this.changeUsername}
              value={this.props.username}
              returnKeyType={'next'}
              onSubmitEditing={e => this.refs.password._textInput.focus()}
              selectTextOnFocus
              onFocus={this.showCachedUsers}
        />
          </InputGroup>

          <InputGroup borderType='regular' style={style.inputGroup} >
            <Input
              ref='password'
              onFocus={this.hideCachedUsers}
              placeholder={t('fragment_landing_password_hint')}
              style={style.input}
              secureTextEntry
              onChangeText={this.changePassword}
              value={this.props.password}
              blurOnSubmit
              onSubmitEditing={() => { this.submit() }}
        />
          </InputGroup>
          <TouchableOpacity style={style.button} onPress={this.submit}>
            <Text style={style.buttonText}> Sign In </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ style.button, { backgroundColor: '#2291CF' }]} onPress={Actions.signup}>
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
  showCachedUsers: state.login.showCachedUsers,
  pin: state.login.pin

}))(Login)
