import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as Animatable from 'react-native-animatable'
import { Actions } from 'react-native-router-flux'
import { loginUsername, loginPassword, openUserList, closeUserList } from './Login.action'
import { loginWithPassword } from './Login.middleware'
import { openLogin } from './Login.action'
import { View, Text, Image, StyleSheet, TouchableOpacity, Keyboard } from 'react-native'
import { InputGroup, Input, Button } from 'native-base'
import TemplateTextInput from '../tpl/TextInput.ui'
import t from '../../lib/LocaleStrings'
import CachedUsers from '../CachedUsers/CachedUsers.ui'
import style from '../Style'
class Login extends Component {

  submit = () => {
    if(this.props.viewPassword) {
      this.refs.loginUsername.blur()
      this.refs.password.blur()
      this.props.dispatch(loginWithPassword(this.props.username, this.props.password))      
    } else {
      this.props.dispatch(openLogin())
      this.refs.fieldsView.transitionTo({opacity:1, height: 90})
      this.refs.fieldsBelowView.transitionTo({height: 0})

    }
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
          <Text style={style.textTitle}>{t('fragment_landing_detail_text')}</Text>
          <Animatable.View ref='fieldsView' style={[style.fieldsView,{opacity:0, height:0}]}>
          <TemplateTextInput
            borderType='underline'
            inputGroupStyle={style.inputGroup}
            ref='loginUsername'
            placeholder={t('fragment_landing_username_hint')}
            style={style.input}
            onChangeText={this.changeUsername}
            value={this.props.username}
            returnKeyType={'next'}
            onSubmitEditing={e => this.refs.password.focus()}
            selectTextOnFocus
            onFocus={this.showCachedUsers}
            autoCorrect={false}
        />

          <TemplateTextInput
            borderType='underline'
            inputGroupStyle={style.inputGroup}
            ref='password'
            onFocus={this.hideCachedUsers}
            placeholder={t('fragment_landing_password_hint')}
            style={style.input}
            secureTextEntry
            onChangeText={this.changePassword}
            value={this.props.password}
            blurOnSubmit
            onSubmitEditing={() => { this.submit() }}
            autoCorrect={false}
        />
          </Animatable.View>
          <TouchableOpacity style={style.button} onPress={this.submit}>
            <Text style={style.buttonText}> Sign In </Text>
          </TouchableOpacity>
          <Animatable.View ref='fieldsBelowView' style={[{height:90}]}/>


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
  viewPassword: state.login.viewPassword,
  showCachedUsers: state.login.showCachedUsers,
  pin: state.login.pin

}))(Login)
