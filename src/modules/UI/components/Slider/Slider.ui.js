// @flow

import * as React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import NativeSlider from 'react-native-slider'

import leftArrowImg from '../../../../assets/images/slider/keyboard-arrow-left.png'
import s from '../../../../locales/strings.js'
import { THEME } from '../../../../theme/variables/airbitz.js'
import { PLATFORM } from '../../../../theme/variables/platform.js'
import { scale } from '../../../../util/scaling.js'

type Props = {
  onSlidingComplete(): mixed,
  parentStyle?: any,
  showSpinner?: boolean,

  // Reset logic:
  forceUpdateGuiCounter?: number,
  resetSlider?: boolean,

  // Disabled logic:
  disabledText?: string,
  sliderDisabled: boolean
}

type State = {
  forceUpdateGuiCounter: number,
  value: number
}

export class Slider extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      forceUpdateGuiCounter: 0,
      value: 10
    }
  }

  onSlidingComplete = (value: number) => {
    if (value <= 1) {
      this.props.onSlidingComplete()
    } else {
      this.setState({ value: 10 })
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
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

  render() {
    const thumbStyle = !this.props.sliderDisabled ? styles.thumb : styles.disabledThumb
    const sliderText = !this.props.sliderDisabled
      ? s.strings.send_confirmation_slide_to_confirm
      : this.props.disabledText || s.strings.select_exchange_amount_short

    return (
      <View style={this.props.parentStyle}>
        <NativeSlider
          disabled={this.props.sliderDisabled}
          onValueChange={this.onValueChange}
          onSlidingComplete={this.onSlidingComplete}
          minimumValue={0}
          maximumValue={10}
          value={this.state.value}
          style={styles.slider}
          thumbStyle={thumbStyle}
          thumbImage={leftArrowImg}
          minimumTrackTintColor={THEME.COLORS.TRANSPARENT}
          maximumTrackTintColor={THEME.COLORS.TRANSPARENT}
          thumbTouchSize={{ width: scale(160), height: scale(160) }}
        />

        {this.props.showSpinner ? (
          <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={styles.activityIndicator} />
        ) : (
          <Text style={styles.textOverlay}>{sliderText}</Text>
        )}
      </View>
    )
  }
}

const rawStyles = {
  slider: {
    backgroundColor: THEME.COLORS.OPACITY_WHITE,
    overflow: 'hidden',
    borderRadius: 26,
    height: 52,
    zIndex: 2
  },
  thumb: {
    width: 52,
    height: 52,
    position: 'absolute',
    backgroundColor: THEME.COLORS.ACCENT_MINT,
    borderRadius: 52
  },
  disabledThumb: {
    width: 52,
    height: 52,
    position: 'absolute',
    backgroundColor: THEME.COLORS.GRAY_2,
    borderRadius: 52
  },
  textOverlay: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: PLATFORM.deviceWidth >= 320 ? 13 : 16,
    position: 'absolute',
    color: THEME.COLORS.WHITE,
    alignSelf: 'center',
    top: 17,
    zIndex: 1
  },
  activityIndicator: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    position: 'absolute',
    alignSelf: 'center',
    top: 17,
    zIndex: 1
  }
}

const styles: typeof rawStyles = StyleSheet.create(rawStyles)
