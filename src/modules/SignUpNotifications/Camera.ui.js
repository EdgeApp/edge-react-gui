import React, { Component } from 'react'
import { Image, View, Text, StyleSheet } from 'react-native'

import Container from '../SignUp.ui'

import appTheme from '../../../Themes/appTheme'
import { cameraPermissions } from './Notifications.middleware'
import NextButton from '../NextButton/NextButton.ui'
import t from '../../lib/LocaleStrings'

export default class Camera extends Component {

  handleSubmit = () => {
    this.props.dispatch(
      cameraPermissions()
    )
  }

  render () {
    return (
      <Container handleSubmit={this.handleSubmit}>
        <View style={style.inputView}>
          <Image source={require('../../img/enable-camera.png')} style={[style.logoImage, {margin: 20}]} />
          <Text style={style.lead}>{ t('activity_signup_camera_header') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_camera_text_1') }</Text>
          <Text style={style.paragraph}>{ t('activity_signup_camera_text_2') }</Text>
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

  usernameInput: {
    height: 60,
    fontSize: 22,
    color: 'skyblue',
    width: 200,
    fontFamily: appTheme.fontFamily,
    marginHorizontal: 30
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
