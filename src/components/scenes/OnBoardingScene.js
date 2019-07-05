// @flow

import React, { Component } from 'react'
import { Animated, Dimensions, Image, Platform, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { Actions } from 'react-native-router-flux'
import GestureRecognizer from 'react-native-swipe-gestures'

import { EDGE } from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton, TextButton } from '../../modules/UI/components/Buttons/index'
import { PagingDotsComponent } from '../../modules/UI/components/PagingDots/PagingDotsComponent.js'
import { dotStyles, styles } from '../../styles/scenes/OnBoardingSceneStyles.js'
import { PLATFORM } from '../../theme/variables/platform'

type OnBoardSlide = {
  text: string,
  iOSImage: string,
  iPhoneX: string,
  iPadImage: string,
  iPadImageHoriz: string,
  androidImage: string,
  androidTabletHorizontalImage: string,
  androidTabletVerticalImage: string
}

type Props = {}
type State = {
  currentIndex: number,
  deviceWidth: number,
  isLandscape: boolean,
  slides: Array<OnBoardSlide>
}

function getInitialState (): State {
  const { height, width } = Dimensions.get('window')

  return {
    currentIndex: 0,
    deviceWidth: width,
    isLandscape: width > height,
    slides: [
      {
        text: s.strings.onboarding_slide_1,
        iOSImage: 'onboard1',
        iPhoneX: 'onboardX1',
        iPadImage: 'iPadOnboarding1Vert',
        iPadImageHoriz: 'iPadOnboarding1Horiz',
        androidImage: 'onboard1',
        androidTabletHorizontalImage: 'onboarding_horiz_tab1',
        androidTabletVerticalImage: 'onboarding_vert_tab1'
      },
      {
        text: s.strings.onboarding_slide_2,
        iOSImage: 'onboard2',
        iPhoneX: 'onboardX2',
        iPadImage: 'iPadOnboarding2Vert',
        iPadImageHoriz: 'iPadOnboarding2Horiz',
        androidImage: 'onboard2',
        androidTabletHorizontalImage: 'onboarding_horiz_tab2',
        androidTabletVerticalImage: 'onboarding_vert_tab2'
      },
      {
        text: s.strings.onboarding_slide_3,
        iOSImage: 'onboard3',
        iPhoneX: 'onboardX3',
        iPadImage: 'iPadOnboarding3Vert',
        iPadImageHoriz: 'iPadOnboarding3Horiz',
        androidImage: 'onboard3',
        androidTabletHorizontalImage: 'onboarding_horiz_tab3',
        androidTabletVerticalImage: 'onboarding_vert_tab3'
      },
      {
        text: s.strings.onboarding_slide_4,
        iOSImage: 'onboard4',
        iPhoneX: 'onboardX4',
        iPadImage: 'iPadOnboarding4Vert',
        iPadImageHoriz: 'iPadOnboarding4Horiz',
        androidImage: 'onboard4',
        androidTabletHorizontalImage: 'onboarding_horiz_tab4',
        androidTabletVerticalImage: 'onboarding_vert_tab4'
      },
      {
        text: s.strings.onboarding_slide_5,
        iOSImage: 'onboard5',
        iPhoneX: 'onboardX5',
        iPadImage: 'iPadOnboarding5Vert',
        iPadImageHoriz: 'iPadOnboarding5Horiz',
        androidImage: 'onboard5',
        androidTabletHorizontalImage: 'onboarding_horiz_tab5',
        androidTabletVerticalImage: 'onboarding_vert_tab5'
      }
    ]
  }
}

class OnBoardingComponent extends Component<Props, State> {
  animatedValue: number

  constructor (props: Props) {
    super(props)
    this.animatedValue = new Animated.Value(0)
    this.state = getInitialState()
    Dimensions.addEventListener('change', this.updateLayout)
  }

  componentWillUnmount () {
    Dimensions.removeEventListener('change', this.updateLayout)
  }

  animateSlide (index: number) {
    Animated.timing(this.animatedValue, {
      toValue: -index * this.state.deviceWidth,
      duration: 300
    }).start(() => this.setState({ currentIndex: index }))
  }

  goBack = () => {
    const { currentIndex } = this.state
    const index = currentIndex - 1
    if (index >= 0) this.animateSlide(index)
  }

  goForward = () => {
    const { currentIndex, slides } = this.state
    const index = currentIndex + 1
    if (index < slides.length) this.animateSlide(index)
    else this.skip()
  }

  skip = () => {
    Actions[EDGE]()
  }

  updateLayout = () => {
    const { height, width } = Dimensions.get('window')
    this.animatedValue = new Animated.Value(-this.state.currentIndex * width)
    this.setState({
      deviceWidth: width,
      isLandscape: width > height
    })
  }

  renderSlide (slide: OnBoardSlide, index: number) {
    const { deviceWidth, isLandscape } = this.state
    const isTablet = DeviceInfo.isTablet()
    const image =
      Platform.OS === 'android'
        ? isTablet
          ? isLandscape
            ? slide.androidTabletHorizontalImage
            : slide.androidTabletVerticalImage
          : slide.androidImage
        : isTablet
          ? isLandscape
            ? slide.iPadImageHoriz
            : slide.iPadImage
          : PLATFORM.isIphoneX
            ? slide.iPhoneX
            : slide.iOSImage
    const textTop = isTablet ? '64%' : index === 2 ? '60%' : '55%'

    return (
      <GestureRecognizer
        key={`slide${index}`}
        onSwipeLeft={this.goForward}
        onSwipeRight={this.goBack}
        config={{
          velocityThreshold: 0.6,
          directionalOffsetThreshold: 200
        }}
        style={{ width: deviceWidth }}
      >
        <Image style={styles.slideImage} source={{ uri: image }} />
        <Text style={[styles.slideText, { top: textTop }]}>{slide.text}</Text>
      </GestureRecognizer>
    )
  }

  render () {
    const { slides } = this.state
    const buttonText = this.state.currentIndex === this.state.slides.length - 1 ? s.strings.onboarding_button : s.strings.string_next_capitalized

    return (
      <View style={styles.mainContainer}>
        <Animated.View style={[styles.slideContainer, { left: this.animatedValue }]}>
          {slides.map((slide, index) => this.renderSlide(slide, index))}
        </Animated.View>
        <View style={styles.skipContainer}>
          <TextButton onPress={this.skip}>
            <TextButton.Text style={styles.buttonText}>{s.strings.onboarding_skip_button}</TextButton.Text>
          </TextButton>
        </View>
        <PagingDotsComponent styles={dotStyles} totalItems={this.state.slides.length} currentIndex={this.state.currentIndex} />
        <View style={styles.buttonContainer}>
          <PrimaryButton style={styles.button} onPress={this.goForward}>
            <PrimaryButton.Text style={styles.buttonText}>{buttonText}</PrimaryButton.Text>
          </PrimaryButton>
        </View>
      </View>
    )
  }
}
export { OnBoardingComponent }
