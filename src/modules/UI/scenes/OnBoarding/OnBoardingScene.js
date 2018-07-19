// @flow
import React, { Component } from 'react'
import { Modal } from 'react-native'
import OnBoardingSlide from './OnBoardingSlide'
import { OnBoardingSceneStyles } from '../../../../styles/indexStyles.js'
import Swiper from 'react-native-swiper'
import PagingDots from '../../../../connectors/components/OnboardingPagingDotsConnector.js'
import s from '../../../../locales/strings.js'
type Props= {
  slides: Array<Object>,
  totalSlides: number,
  finishOnBoarding(): void,
  updateSlideIndex(number): void
}

export default class OnBoardingScene extends Component<Props, {}> {
  renderSlides = (styles: Object) => {
    let counter = 0
    return this.props.slides.map(Slide => {
      counter++
      const buttonFunction = counter === this.props.totalSlides ? this.props.finishOnBoarding : null
      return (
        <OnBoardingSlide
          slide={Slide}
          buttonText={s.strings.onboarding_button}
          finishOnBoarding={buttonFunction}
          key={'slides_' + counter}
        />
      )
    })
  }
  onRequestClose = () => {
    // do nothing, necessary callback for modal
  }
  render () {
    const styles = OnBoardingSceneStyles
    return <Modal style={styles.modalContainer} isVisible={true} onRequestClose={this.onRequestClose}>
      <Swiper style={styles.wrapper} showsPagination={false} showsButtons={false} index={0} onIndexChanged={this.props.updateSlideIndex}>
        {this.renderSlides(styles)}
      </Swiper>
      <PagingDots styles={styles.dots}/>
    </Modal>
  }
}
