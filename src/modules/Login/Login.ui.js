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
    this.props.dispatch(loginWithPassword(this.props.username, this.props.password))
  }

  changeUsername = (username) => {
    this.props.dispatch(loginUsername(username))
  }

  changePassword = (password) => {
    this.props.dispatch(loginPassword(password))  
  }
  
  render() {
    console.log(this.refs)
    return (
      <View style={style.container}>

        <InputGroup borderType='regular' style={style.inputGroup} >
          <Input 
              placeholder={t('fragment_landing_username_hint')} 
              style={style.input} 
              onChangeText={ this.changeUsername } 
              value={this.props.username}
              returnKeyType = {"next"}
              onSubmitEditing={ e =>  this.refs.password._textInput.focus() }
        />    
        </InputGroup>

        <InputGroup borderType='regular' style={style.inputGroup} >
          <Input 
            ref='password'
            placeholder={t('fragment_landing_password_hint')} 
            style={style.input}  
            secureTextEntry={true} 
            onChangeText={ this.changePassword } 
            value={this.props.password}
            blurOnSubmit={ true }
            onSubmitEditing={ this.submit }  
          /> 
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
