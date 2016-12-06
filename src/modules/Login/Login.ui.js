import React, { Component } from 'react'
import { connect } from 'react-redux'

import { loginUsername, loginPassword } from './Login.action'
import { loginWithPassword } from './Login.middleware'

import { View, Text, Image, StyleSheet } from 'react-native'
import { InputGroup, Input, Button } from 'native-base';
import t from '../../lib/LocaleStrings'
import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window');

class Login extends Component {


  submit = () => {
    console.log(this.props.username)
    console.log(this.props.password)
	this.props.dispatch(loginWithPassword(this.props.username, this.props.password))
  }

  changeUsername = (username) => {
    this.props.dispatch(loginUsername(username))
  }

  changePassword = (password) => {
    this.props.dispatch(loginPassword(password))  
  }
  
  changePin = (pin) => {
  
  }

  render() {
    return (
      <View style={style.container}>

        <InputGroup 
          borderType='regular' 
          style={style.inputGroup} 
        >
          <Input placeholder={t('fragment_landing_username_hint')} style={style.input} onChangeText={ this.changeUsername } value={this.props.username}/>    
        </InputGroup>

        <InputGroup 
          borderType='regular' 
          style={style.inputGroup} 
        >
          <Input placeholder={t('fragment_landing_password_hint')} style={style.input}  secureTextEntry={true} onChangeText={ this.changePassword } value={this.props.password}/>    
        </InputGroup>

        <Button style={style.button} block large onPress={this.submit}>Sign In</Button>
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

  button : {
    backgroundColor: "#80C342",
    marginVertical: 10,
    height: 45
  },

  inputGroup: {
    marginVertical: 10,
    backgroundColor: "rgba(0,0,0,0.5)"  
  },

  input: {
    color: '#FFF'  
  }

});

export default connect( state =>  ({

  username  :  state.login.username,
  password  :  state.login.password,
  pin      :  state.login.pin

}) )(Login)
