import React, {Component} from 'react'
import {Text, View} from 'react-native'
import styles from './styles.js'
import Slider from 'react-native-slider'
import {sprintf} from 'sprintf-js'
import strings from '../../../../locales/default'

const SLIDE_TO_COMPLETE_TEXT = sprintf(strings.enUS['send_confirmation_slide_to_confirm'])

export default class ABSlider extends Component {
  constructor (props) {
    super(props)

    this.state = {
      value: 10,
      sliderDisabled: props.sliderDisabled,
      onSlidingComplete: props.onSlidingComplete
    }
  }

  onSlidingComplete = (value) => {
    if (value <= 1) {
      this.props.onSlidingComplete()
    } else {
      this.setState({value: 10})
    }
  };

  onValueChange = (value) => {
    this.setState({value})
  }

  render () {
    return (
      <View style={styles.container}>
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
          minimumTrackTintColor='transparent'
          maximumTrackTintColor='transparent'
          thumbTouchSize={{width: 160, height: 160}}
        />
        <Text style={styles.textOverlay}>
          {SLIDE_TO_COMPLETE_TEXT}
        </Text>
      </View>
    )
  }
}
