import React, { Component } from 'react'
import { connect } from 'react-redux'

import { closeLoginUsingPin, openLogin, loginPIN } from './Login.action'
import { loginWithPassword } from './Login.middleware'
import { removeUserToLogin } from '../CachedUsers/CachedUsers.action'

import { View, Text, Image, StyleSheet,TouchableHighlight } from 'react-native'
import { InputGroup, Input, Button } from 'native-base';
import t from '../../lib/LocaleStrings'

import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window');

class Login extends Component {

  submit = () => {
    console.log(this.props.pin)
  }

  changePin = (pin) => {
    this.props.dispatch(loginPIN(pin))  
  }

  viewPasswordInput = (pin) => {
    this.props.dispatch(removeUserToLogin())  
    this.props.dispatch(openLogin())  
  }
  
  render() {
    return (
      <View style={style.container}>

        <Text style={[ style.text, { fontSize: 20 } ]}>{ this.props.user ? this.props.user.name : 'No User Selected' }</Text>

        <View style={{ width: 100 }}>
          <InputGroup borderType='regular' style={style.inputGroup}>
            <Input 
              placeholder={t('fragment_landing_enter_pin')} 
              style={style.input}  
              onChangeText={ this.changePin } 
              value={this.props.pin}
              keyboardType="numeric"
              maxLength={4} 
              autoCorrect={ false }
              returnKeyType="done"
              blurOnSubmit={ true }
              onSubmitEditing={ this.submit }  
          />    
          </InputGroup>
        </View>

        <TouchableHighlight onPress={this.viewPasswordInput}>
          <Text style={ style.text }>{ t('fragment_landing_switch_user') }</Text>
        </TouchableHighlight>

      </View>
    )
  }
}

const style = StyleSheet.create({

  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 30,
    width: width * 0.6,
    marginVertical:15
  },

  inputGroup: {
    marginVertical: 30,
    backgroundColor: "rgba(0,0,0,0.5)"  
  },

  input: {
    textAlign: 'center',
    color: '#FFF'  
  },

  text: {
    fontSize:15,
    color: "#CCC"
  }

});

export default connect( state =>  ({

  pin   :  state.login.pin,
  user  :  state.cachedUsers.users.find( user => user.id === state.cachedUsers.selectedUserToLogin)

}) )(Login)
