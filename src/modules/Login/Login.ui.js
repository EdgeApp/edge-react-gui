import React, { Component } from 'react'
import { connect } from 'react-redux'

import { loginUsername, loginPassword, openUserList, closeUserList } from './Login.action'
import { loginWithPassword } from './Login.middleware'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
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

  render () {
    var cUsers = function() {
      if (this.props.showCachedUsers) {
        return (<CachedUsers  style={style.noflex}/>)
      } else {
        return (<Text style={style.noflex}></Text>)
      }
    }.bind(this)
    return (
      <View style={style.container}>

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


        {cUsers()}
      </View>
    )
  }
}

const style = StyleSheet.create({
  noflex: {
    flexShrink: 1
  },
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8,
    marginVertical: 15
  },

  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#80C342',
    marginVertical: 10,
    height: 45
  },

  buttonText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 22,
    flex: 1
  },

  inputGroup: {
    marginVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },

  input: {
    color: '#FFF'
  }

})

export default connect(state => ({

  username: state.login.username,
  password: state.login.password,
  showCachedUsers: state.login.showCachedUsers,
  pin: state.login.pin

}))(Login)
