// @flow
import React, { Component } from 'react'
import { Animated, Modal, View } from 'react-native'

import PagingDots from '../../../../connectors/components/OnboardingPagingDotsConnector.js'
import s from '../../../../locales/strings.js'
import { OnBoardingSceneStyles } from '../../../../styles/indexStyles.js'
import { PLATFORM } from '../../../../theme/variables/platform'
import { PrimaryButton } from '../../components/Buttons/'
import OnBoardingSlide from './OnBoardingSlide'

// import Swiper from 'react-native-swiper'

type Props= {
  slides: Array<Object>,
  totalSlides: number,
  finishOnBoarding(): void,
  updateSlideIndex(number): void
}
type State = {
  currentIndex: number
}

function getInitialState () {
  return {
    currentIndex: 0
  }
}

export default class OnBoardingScene extends Component<Props, State> {
  animatedValue: number

  constructor (props: Props) {
    super(props)
    this.animatedValue = new Animated.Value(0)
    this.state = getInitialState()
  }
  onNextSlide = () => {
    const index = this.state.currentIndex + 1
    if (index === this.props.totalSlides) {
      return
    }
    this.props.updateSlideIndex(index)
    const newValue = (index) * PLATFORM.deviceWidth
    Animated.timing(this.animatedValue, {
      toValue: -(newValue),
      duration: 100
    }).start(this.onCompleteMove(index))
  }
  onCompleteMove = (index: number) => {
    console.log('onboarding: onComplete', index)
    this.setState({
      currentIndex: index
    })
  }
  renderSlides = (styles: Object) => {
    let counter = 0
    return this.props.slides.map(Slide => {
      counter++
      // const buttonFunction = counter === this.props.totalSlides ? this.props.finishOnBoarding : null
      return (
        <OnBoardingSlide
          slide={Slide}
          key={'slides_' + counter}
        />
      )
    })
  }
  renderButtons = (styles: Object) => {
    if (this.state.currentIndex === this.props.totalSlides - 1) {
      return <View style={styles.buttonContainer} >
        <PrimaryButton
          style={styles.button}
          text={s.strings.onboarding_button}
          onPressFunction={this.props.finishOnBoarding}
        />
      </View>
    }
    return <View style={styles.buttonContainer} >
      <PrimaryButton
        style={styles.buttonAlt}
        text={s.strings.onboarding_skip_button}
        onPressFunction={this.props.finishOnBoarding}
      />
      <View style={styles.shim} />
      <PrimaryButton
        style={styles.button}
        text={s.strings.string_next}
        onPressFunction={this.onNextSlide}
      />
    </View>
  }
  onRequestClose = () => {
    // do nothing, necessary callback for modal
  }
  render () {
    const styles = OnBoardingSceneStyles
    const containerWidth = PLATFORM.deviceWidth * this.props.totalSlides
    const containerStyle = {...styles.slideContainer, width: containerWidth}
    const animatedStyle = {left: this.animatedValue}
    return <Modal style={styles.modalContainer} isVisible={true} onRequestClose={this.onRequestClose}>
      <View style={styles.slideContainer}>
        <Animated.View style={[containerStyle, animatedStyle]}>
          {this.renderSlides(styles)}
        </Animated.View>
        <PagingDots styles={styles.dots}/>
        {this.renderButtons(styles)}
      </View>
    </Modal>
  }
}
