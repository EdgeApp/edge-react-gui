// @flow
import React, { Component } from 'react'
import { View, Text, ImageBackground, Platform } from 'react-native'
import {
  OnBoardingSlideStyles as styles
} from '../../../../styles/indexStyles.js'
import { PrimaryButton } from '../../components/Buttons/'
import { ANDROID } from '../../../../constants/indexConstants'

type Props = {
  finishOnBoarding?: null | () => void,
  slide: Object,
  buttonText?: string,
}

type State = {
  currentIndex: number,
  lastSlide: boolean,
}

export default class OnBoardingScene extends Component<Props, State> {
  renderButton = () => {
    if (this.props.finishOnBoarding) {
      return (
        <PrimaryButton
          style={styles.button}
          text={this.props.buttonText}
          onPressFunction={this.props.finishOnBoarding}
        />
      )
    }
    return null
  }
  render () {
    console.log('swiper: image', this.props.slide.iOSImage)
    const image = Platform.OS === ANDROID ? this.props.slide.androidImage : this.props.slide.iOSImage
    return (
      <ImageBackground source={{uri: image}} style={styles.container}>
        <View style={styles.innerTop} />
        <View style={styles.innerBottom}>
          <View style={styles.textBox}>
            <Text style={styles.text}>{this.props.slide.text}</Text>
          </View>
        </View>
        <View style={styles.buttonContainer} >
          {this.renderButton()}
        </View>
      </ImageBackground>
    )
  }
}
