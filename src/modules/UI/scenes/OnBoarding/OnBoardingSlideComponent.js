// @flow
import React, { Component } from 'react'
import { Dimensions, ImageBackground, Platform, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import GestureRecognizer, { swipeDirections } from 'react-native-swipe-gestures'

import { ANDROID } from '../../../../constants/indexConstants'
import { OnBoardingSlideStyles, OnBoardingSlideTabletStyles } from '../../../../styles/indexStyles.js'
import { PLATFORM } from '../../../../theme/variables/platform'

type Props = {
  slide: Object,
  swipeLeft(): void,
  swipeRight(): void
}

type State = {
  orientation: string
}

class OnBoardingSlideComponent extends Component<Props, State> {
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

  onSwipe = (gestureName: string) => {
    const { SWIPE_LEFT, SWIPE_RIGHT } = swipeDirections
    switch (gestureName) {
      case SWIPE_LEFT:
        this.props.swipeLeft()
        break
      case SWIPE_RIGHT:
        this.props.swipeRight()
        break
    }
  }
  render () {
    const isTablet = DeviceInfo.isTablet()
    const styles = isTablet ? OnBoardingSlideTabletStyles : OnBoardingSlideStyles
    const image =
      Platform.OS === ANDROID
        ? isTablet
          ? this.state.orientation === 'landscape'
            ? this.props.slide.androidTabletHorizontalImage
            : this.props.slide.androidTabletVerticalImage
          : this.props.slide.androidImage
        : isTablet
          ? this.state.orientation === 'landscape'
            ? this.props.slide.iPadImageHoriz
            : this.props.slide.iPadImage
          : PLATFORM.isIphoneX
            ? this.props.slide.iPhoneX
            : this.props.slide.iOSImage
    const container = { ...styles.container, width: Dimensions.get('window').width, height: Dimensions.get('window').height }
    const config = {
      velocityThreshold: 0.3,
      directionalOffsetThreshold: 10
    }
    return (
      <GestureRecognizer onSwipe={(direction, state) => this.onSwipe(direction)} config={config}>
        <ImageBackground source={{ uri: image }} style={container}>
          <View style={styles.innerTop} />
          <View style={styles.innerBottom}>
            <View style={styles.textBox}>
              <Text style={styles.text}>{this.props.slide.text}</Text>
            </View>
          </View>
        </ImageBackground>
      </GestureRecognizer>
    )
  }
}
export { OnBoardingSlideComponent }
