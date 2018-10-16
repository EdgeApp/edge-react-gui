// @flow

import React, { Component } from 'react'
import { Text, View } from 'react-native'
import Slider from 'react-native-slider'
import slowlog from 'react-native-slowlog'

import leftArrowImg from '../../../../assets/images/slider/keyboard-arrow-left.png'
import { scale } from '../../../../lib/scaling.js'
import s from '../../../../locales/strings.js'
import styles from './styles.js'

const SLIDE_TO_COMPLETE_TEXT = s.strings.send_confirmation_slide_to_confirm

type Props = {
  resetSlider?: boolean,
  sliderDisabled: boolean,
  forceUpdateGuiCounter: number,
  onSlidingComplete: () => {},
  parentStyle: any
}

type State = {
  onSlidingComplete: () => {},
  forceUpdateGuiCounter: number,
  sliderDisabled: boolean,
  value: number
}

export default class ABSlider extends Component<Props, State> {
  constructor (props: Props) {
    super(props)

    this.state = {
      forceUpdateGuiCounter: 0,
      value: 10,
      sliderDisabled: props.sliderDisabled,
      onSlidingComplete: props.onSlidingComplete
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  onSlidingComplete = (value: number) => {
    if (value <= 1) {
      this.props.onSlidingComplete()
    } else {
      this.setState({ value: 10 })
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    if (nextProps.resetSlider && nextProps.forceUpdateGuiCounter !== this.state.forceUpdateGuiCounter) {
      this.setState({
        value: 10,
        forceUpdateGuiCounter: nextProps.forceUpdateGuiCounter
      })
    }
  }

  onValueChange = (value: number) => {
    this.setState({ value })
  }

  render () {
    return (
      <View style={[styles.container, this.props.parentStyle]}>
        <Slider
          disabled={this.props.sliderDisabled}
          onValueChange={this.onValueChange}
          onSlidingComplete={this.onSlidingComplete}
          minimumValue={0}
          maximumValue={10}
          value={this.state.value}
          style={styles.slider}
          trackStyle={styles.track}
          thumbStyle={styles.thumb}
          thumbImage={leftArrowImg}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTouchSize={{ width: scale(160), height: scale(160) }}
        />
        <Text style={styles.textOverlay}>{SLIDE_TO_COMPLETE_TEXT}</Text>
      </View>
    )
  }
}
