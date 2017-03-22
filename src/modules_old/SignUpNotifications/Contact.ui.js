import React, { Component } from 'react'
import { Image, View, Text, StyleSheet } from 'react-native'

import appTheme from '../../../Themes/appTheme'
import Container from '../SignUp.ui'
import NextButton from '../NextButton/NextButton.ui'
import { readContactPermissions } from './Notifications.middleware'
import t from '../../lib/LocaleStrings'

export default class Contact extends Component {

  handleSubmit = () => {
    this.props.dispatch(
      readContactPermissions()
    )
  }

  render () {
    return (
      <Container handleSubmit={this.handleSubmit}>
        <View style={style.inputView}>
          <Image source={require('../../img/enable-contacts.png')} style={[style.logoImage, {margin: 20}]} />

          <Text style={style.lead}>{ t('activity_signup_contact_header') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_contact_text_1') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_contact_text_2') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_contact_text_3') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_contact_text_4') }</Text>
          <NextButton onPress={() => { this.handleSubmit() }} />
        </View>
      </Container>
    )
  }
}

const style = StyleSheet.create({

  inputView: {
    flex: 1,
    marginTop: 30,
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },

  paragraph: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: appTheme.fontFamily,
    marginHorizontal: 30
  },

  lead: {
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: appTheme.fontFamily,
    marginHorizontal: 30
  }

})
