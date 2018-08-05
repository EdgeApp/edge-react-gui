// @flow
import React, { Component } from 'react'
import { Dimensions, ImageBackground, Platform, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'

import { ANDROID } from '../../../../constants/indexConstants'
import {
  OnBoardingSlideStyles as styles
} from '../../../../styles/indexStyles.js'
import { PLATFORM } from '../../../../theme/variables/platform'

type Props = {
  slide: Object,
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
        : PLATFORM.isIphoneX ? this.props.slide.iPhoneX : this.props.slide.iOSImage
      )
    return (
      <ImageBackground source={{uri: image}} style={styles.container}>
        <View style={styles.innerTop} />
        <View style={styles.innerBottom}>
          <View style={styles.textBox}>
            <Text style={styles.text}>{this.props.slide.text}</Text>
          </View>
        </View>
      </ImageBackground>
    )
  }
}
export { OnBoardingSlideComponent }
