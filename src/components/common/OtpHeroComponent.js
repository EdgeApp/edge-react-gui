// @flow

import React, { Component } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

import iconImage from '../../assets/images/otp/OTP-badge.png'
import s from '../../locales/strings.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'

type OtpHeroProps = {
  enabled: boolean
}

export default class OtpHero extends Component<OtpHeroProps> {
  renderText = () => {
    if (this.props.enabled) {
      return <Text style={styles.bodyText}>{s.strings.title_otp_enabled}</Text>
    }
    return <Text style={styles.bodyText}>{s.strings.title_otp_disabled}</Text>
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.shim} />
        <Image source={iconImage} size={scale(50)} />
        <View style={styles.shim} />
        {this.renderText()}
      </View>
    )
  }
}

const rawStyles = {
  container: {
    width: '100%',
    height: scale(120),
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  shim: {
    height: scale(10)
  },
  bodyText: {
    width: '100%',
    textAlign: 'center',
    fontSize: scale(21),
    color: THEME.COLORS.GRAY_1
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
