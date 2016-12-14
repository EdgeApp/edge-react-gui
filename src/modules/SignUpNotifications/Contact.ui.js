import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux'
import { View, Text, TextInput, StyleSheet, PermissionsAndroid } from 'react-native'

import Container from '../SignUp.ui'

import t from '../../lib/LocaleStrings'
import { requestContactPermission } from '../../lib/permissions'

export default class Contact extends Component {

  // handleSubmit = () => {
  //   requestContactPermission((error, granted) => {
  //
  //     if(!error){
  //       Actions.contactNotification()
  //     } 
  //
  //   })
  // }

  render () {
    return (
      <Container handleSubmit={this.handleSubmit}>
        <View style={style.inputView}>
          <Text style={style.lead}>{ t('activity_signup_contact_header') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_contact_text_1') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_contact_text_2') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_contact_text_3') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_contact_text_4') }</Text>
        </View>
      </Container>
    )
  }
}

const style = StyleSheet.create({

  inputView: {
    flex: 1,
    marginTop: 30,
    marginLeft: 30,
    marginRight: 30,
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },

  usernameInput: {
    height: 60,
    fontSize: 22,
    color: 'skyblue',
    width: 200
  },

  paragraph: {
    marginTop: 10,
    fontSize: 14
  },

  lead: {
    fontWeight: 'bold',
    fontSize: 16
  }

})
