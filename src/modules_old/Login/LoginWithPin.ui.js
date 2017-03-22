import React, { Component } from 'react'
import { connect } from 'react-redux'

import { openLogin, loginPIN, openUserList, closeUserList } from './Login.action'
import { loginWithPin } from './Login.middleware'
import CachedUsers from '../CachedUsers/CachedUsers.ui'
import { removeUserToLogin } from '../CachedUsers/CachedUsers.action'

import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native'
import { InputGroup, Input } from 'native-base'
import t from '../../lib/LocaleStrings'
import style from '../Style'
class Login extends Component {

  submit = () => {
    this.refs.pinInput.blur()
    this.props.dispatch(
      loginWithPin(
        this.props.user,
        this.props.pin
      )
    )
    this.props.dispatch(loginPIN(''))
  }
  handleViewPress = () => {
    this.refs.pinInput._textInput.focus()
  }

  changePin = (pin) => {
    this.props.dispatch(loginPIN(pin))
    if (pin.length > 3) {
      setTimeout(this.submit, 200)
    }
  }
  changePinDummy = (pinDummy) => {
    if (this.props.pinDummy.length < this.props.pin.length) {
      this.props.dispatch(loginPIN(this.props.pin.substr(0, this.props.pinDummy.length)))
    }
  }

  viewPasswordInput = (pin) => {
    this.props.dispatch(closeUserList())
    this.props.dispatch(removeUserToLogin())
    this.props.dispatch(openLogin())
  }

  showCachedUsers = () => {
    this.props.dispatch(openUserList())
    this.refs.pinInput.blur()
  }

  hideCachedUsers = () => {
    this.props.dispatch(closeUserList())
  }
  keyboardDidShow = () => {

  }
  keyboardDidHide = () => {
    // this.props.dispatch(closeUserList())
  }
  toggleCachedUsers = () => {
    if (this.props.showCachedUsers) {
      this.hideCachedUsers()
    } else {
      this.showCachedUsers()
    }
  }
  componentDidUpdate (oldProps) {
    if (oldProps.showCachedUsers && !this.props.showCachedUsers) {
      this.refs.pinInput._textInput.focus()
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
  focusPin = () => {
    this.refs.pinDummyInput.blur()
    this.refs.pinInput.focus()
  }
  pinStyle = () => {
    if (this.props.pinDummy.length > 0) return {fontSize: 110, paddingTop: 20, paddingBottom: -20}
    return {}
  }
  render () {
    const cUsers = () => {
      if (this.props.showCachedUsers) {
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

          <View style={{ width: 165, marginTop: 5 }}>
            <InputGroup borderType='regular' style={[style.inputGroup, {padding: 0, alignSelf: 'center'}]}>
              <Input
                selectionColor='#FFFFFF'
                placeholderTextColor='rgba(200,200,200,0.5)'
                placeholder={t('fragment_landing_enter_pin')}
                style={[style.input, { padding: 0, marginHorizontal: 10, height: 50, marginVertical: 0, fontSize: 28, textAlign: 'center' }, this.pinStyle()]}
                value={this.props.pinDummy}
                maxLength={4}
                autoCorrect={false}
                onChangeText={this.changePinDummy}
                onFocus={this.focusPin}
                ref='pinDummyInput'
            />
            </InputGroup>
          </View>

          <TouchableOpacity style={{padding: 15, backgroundColor: 'transparent'}} onPress={this.viewPasswordInput}>
            <Text style={[style.text, {fontSize: 15, color: 'skyblue'}]}>{ t('fragment_landing_switch_user') }</Text>
          </TouchableOpacity>
          <TextInput
            ref='pinInput'
            style={{height: 0, width: 0}}
            secureTextEntry
            value={this.props.pin}
            onChangeText={this.changePin}
            autoFocus
            autoCorrect={false}
            returnKeyType='done'
            onSubmitEditing={this.submit}
            blurOnSubmit
            keyboardType='numeric'
          />
        </View>
        {cUsers()}
      </View>
    )
  }
}

export default connect(state => ({

  pin: state.login.pin,
  pinDummy: state.login.pinDummy,
  user: state.cachedUsers.selectedUserToLogin,
  showCachedUsers: state.login.showCachedUsers

}))(Login)
