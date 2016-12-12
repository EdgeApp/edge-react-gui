import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Actions } from 'react-native-router-flux'
import { loginUsername, loginPassword, openUserList, closeUserList } from './Login.action'
import { loginWithPassword } from './Login.middleware'
import { View, Text, Image, StyleSheet, TouchableOpacity, Keyboard } from 'react-native'
import { InputGroup, Input, Button } from 'native-base'

import t from '../../lib/LocaleStrings'
import CachedUsers from '../CachedUsers/CachedUsers.ui'

import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window')

class Login extends Component {

  submit = () => {
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
    var cUsers = function() {
      if (this.props.showCachedUsers) {
        return (<CachedUsers />)
      } else {
        return null
      }
    }.bind(this)


    return (
    <View style={style.container}>
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
            onBlur={this.hideCachedUsers}
            onBeginEditing={this.hideCachedUsers}
        />
        </InputGroup>

        
        <InputGroup borderType='regular' style={style.inputGroup} >
          <Input
            ref='password'
            placeholder={t('fragment_landing_password_hint')}
            style={style.input}
            secureTextEntry
            onChangeText={this.changePassword}
            value={this.props.password}
            blurOnSubmit
            onSubmitEditing={this.submit}
          />
        </InputGroup>        
        <TouchableOpacity style={style.button} onPress={this.submit}>
          <Text style={style.buttonText}> Sign In </Text>
        </TouchableOpacity>        
        <TouchableOpacity style={[ style.button, { backgroundColor: '#2291CF' }]} onPress={Actions.signup}>
          <Text style={style.buttonText}>{t('fragment_landing_signup_button')}</Text>
        </TouchableOpacity>
        
      </View>
      {cUsers()}
    </View>
    )
  }
}

const style = StyleSheet.create({
  container: { 
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: width,
  },
  form: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'center',
    justifyContent: 'center',
    width: width * 0.7    
  },

  buttonText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    flex: 1
  },

  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#80C342',
    height: 45,
    marginVertical: 3
  },

  buttonText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    flex: 1
  },

  inputGroup: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginVertical: 3,
    padding: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 4,
    borderColor: '#888'
  },

  input: {
    color: '#FFF',
    fontSize: 14,
    marginVertical: -5
  }

})

export default connect(state => ({

  username: state.login.username,
  password: state.login.password,
  showCachedUsers: state.login.showCachedUsers,
  pin: state.login.pin

}))(Login)
