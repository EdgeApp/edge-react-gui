import React, { Component } from 'react'
import { connect } from 'react-redux'

import { openLogin, loginPIN, openUserList, closeUserList } from './Login.action'
import { loginWithPin } from './Login.middleware'
import CachedUsers from '../CachedUsers/CachedUsers.ui'
import { removeUserToLogin } from '../CachedUsers/CachedUsers.action'

import { View, Text, TouchableOpacity, Keyboard } from 'react-native'
import { InputGroup, Input } from 'native-base'

import t from '../../lib/LocaleStrings'
import style from '../Style'
class Login extends Component {

  submit = () => {
    this.refs.pinInput._textInput.blur()
    this.props.dispatch(
      loginWithPin(
        this.props.user,
        this.props.pin
      )
    )
    this.props.dispatch(loginPIN(''))
  }

  changePin = (pin) => {
    this.props.dispatch(loginPIN(pin))
    if (pin.length > 3) {
      setTimeout(this.submit, 200)
    }
  }

  viewPasswordInput = (pin) => {
    this.props.dispatch(removeUserToLogin())
    this.props.dispatch(openLogin())
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
  toggleCachedUsers = () => {
    if (this.props.showCachedUsers) {
      this.hideCachedUsers()
    } else {
      this.showCachedUsers()
    }
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
        console.log(this.refs.pinInput)
        return (<CachedUsers blurField={this.refs.pinInput} />)
      } else {
        return null
      }
    }

    return (
      <View style={style.container}>
        <View style={[style.form, {marginTop: 10}]}>
          <TouchableOpacity style={{backgroundColor: 'transparent'}} onPress={this.toggleCachedUsers}>
            <Text style={[ style.text, { color: 'skyblue', fontSize: 18, marginTop: 10 } ]}>{ this.props.user ? this.props.user : 'No User Selected' }</Text>
          </TouchableOpacity>

          <View style={{ width: 170, marginBottom: 15, marginTop: 5 }}>
            <InputGroup borderType='regular' style={[style.inputGroup, {padding: 0, alignSelf: 'center'}]}>
              <Input
                ref='pinInput'
                placeholder={t('fragment_landing_enter_pin')}
                style={[style.input, { marginHorizontal: 10, height: 60, marginVertical: 0,  fontSize: 28, textAlign: 'left' }]}
                onChangeText={this.changePin}
                value={this.props.pin}s
                keyboardType='numeric'
                maxLength={4}
                autoFocus
                autoCorrect={false}
                returnKeyType='done'
                blurOnSubmit
                onSubmitEditing={this.submit}
            />
            </InputGroup>
          </View>

          <TouchableOpacity style={{backgroundColor: 'transparent'}} onPress={this.viewPasswordInput}>
            <Text style={[style.text,{fontSize: 15, color: 'skyblue'}]}>{ t('fragment_landing_switch_user') }</Text>
          </TouchableOpacity>
        </View>
        {cUsers()}
      </View>
    )
  }
}

export default connect(state => ({

  pin: state.login.pin,
  user: state.cachedUsers.selectedUserToLogin,
  showCachedUsers: state.login.showCachedUsers

}))(Login)
