// @flow
import React, { Component } from 'react'
import { Dimensions, ImageBackground, Platform, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'

import { ANDROID } from '../../../../constants/indexConstants'
import {
  OnBoardingSlideStyles as styles
} from '../../../../styles/indexStyles.js'
import { PrimaryButton } from '../../components/Buttons/'

type Props = {
  finishOnBoarding?: null | () => void,
  slide: Object,
  buttonText?: string,
}

type State = {
  orientation: string
}

export default class OnBoardingScene extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const { height, width } = Dimensions.get('window')
    const isLandscape = width > height
    this.state = {
      orientation: isLandscape ? 'landscape' : 'portrait'
    }
    Dimensions.addEventListener('change', this.update)
  }
  update = () => {
    const { height, width } = Dimensions.get('window')
    const isLandscape = width > height
    this.setState({
      orientation: isLandscape ? 'landscape' : 'portrait'
    })
  }
  componentWillUnmount () {
    Dimensions.removeEventListener('change', this.update)
  }
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
    const isTablet = DeviceInfo.isTablet()
    const image = Platform.OS === ANDROID
      ? (isTablet
        ? (this.state.orientation === 'landscape'
          ? this.props.slide.androidTabletHorizontalImage
          : this.props.slide.androidTabletVerticalImage
        )
        : this.props.slide.androidImage
      )
      : (isTablet
        ? (this.state.orientation === 'landscape'
          ? this.props.slide.iPadImageHoriz
          : this.props.slide.iPadImage
        )
        : this.props.slide.iOSImage
      )
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
