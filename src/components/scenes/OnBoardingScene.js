// @flow
import React, { Component } from 'react'
import { Animated, Dimensions, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { EDGE } from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton, TextButton } from '../../modules/UI/components/Buttons/index'
import { PagingDotsComponent } from '../../modules/UI/components/PagingDots/PagingDotsComponent.js'
import { OnBoardingSceneStyles } from '../../styles/indexStyles.js'
import { PLATFORM } from '../../theme/variables/platform'
import { OnBoardingSlideComponent } from '../common/OnBoardingSlideComponent.js'

/* import Modal from 'react-native-modal' */
// import Swiper from 'react-native-swiper'
export type OnBoardSlide = {
  text: string,
  iOSImage: string,
  iPhoneX: string,
  iPadImage: string,
  iPadImageHoriz: string,
  androidImage: string,
  androidTabletHorizontalImage: string,
  androidTabletVerticalImage: string
}

type Props = {
  slides: Array<Object>,
  totalSlides: number,
  updateSlideIndex(number): void
}
type State = {
  currentIndex: number,
  totalSlides: 5,
  slides: Array<OnBoardSlide>
}

function getInitialState () {
  return {
    currentIndex: 0,
    totalSlides: 5,
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
  }

  onNextSlide = () => {
    const index = this.state.currentIndex + 1
    if (index === this.state.totalSlides) {
      return
    }
    const newValue = index * PLATFORM.deviceWidth
    Animated.timing(this.animatedValue, {
      toValue: -newValue,
      duration: 300
    }).start(this.onCompleteMove(index))
  }
  onPreviousSlide = () => {
    const index = this.state.currentIndex - 1
    if (index === -1) {
      return
    }
    const newValue = index * Dimensions.get('window').width
    Animated.timing(this.animatedValue, {
      toValue: -newValue,
      duration: 300
    }).start(this.onCompleteMove(index))
  }
  onCompleteMove = (index: number) => {
    this.setState({
      currentIndex: index
    })
  }
  finishOnBoarding = () => {
    Actions[EDGE]()
  }
  renderSlides = (styles: Object) => {
    let counter = 0
    return this.state.slides.map(Slide => {
      counter++
      // const buttonFunction = counter === this.props.totalSlides ? this.props.finishOnBoarding : null
      return <OnBoardingSlideComponent slide={Slide} key={'slides_' + counter} swipeLeft={this.onNextSlide} swipeRight={this.onPreviousSlide} index={counter} />
    })
  }

  render () {
    const styles = OnBoardingSceneStyles
    const containerWidth = Dimensions.get('window').width * this.state.totalSlides
    const containerStyle = { ...styles.slideContainer, width: containerWidth }
    const animatedStyle = { left: this.animatedValue }
    const buttonFunction = this.state.currentIndex === this.state.totalSlides - 1 ? this.finishOnBoarding : this.onNextSlide
    const buttonText = this.state.currentIndex === this.state.totalSlides - 1 ? s.strings.onboarding_button : s.strings.string_next_capitalized
    return (
      <View style={styles.mainContainer}>
        <View style={styles.slideContainer}>
          <Animated.View style={[containerStyle, animatedStyle]}>{this.renderSlides(styles)}</Animated.View>
          <PagingDotsComponent styles={styles.dots} totalItems={this.state.totalSlides} currentIndex={this.state.currentIndex} />
          <View style={styles.buttonContainerRow}>
            <PrimaryButton style={styles.button} onPress={buttonFunction}>
              <PrimaryButton.Text style={styles.buttonText}>{buttonText}</PrimaryButton.Text>
            </PrimaryButton>
          </View>
          <View style={styles.textOnlyContainer}>
            <TextButton style={styles.textOnlyButton} onPress={this.finishOnBoarding}>
              <TextButton.Text style={styles.buttonText}>{s.strings.onboarding_skip_button}</TextButton.Text>
            </TextButton>
          </View>
        </View>
      </View>
    )
  }
}
export { OnBoardingComponent }
