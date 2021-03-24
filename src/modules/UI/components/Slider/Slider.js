// @flow

import * as React from 'react'
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native'
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

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

const SLIDER_WIDTH = 300
const KNOB_WIDTH = 70
const MAX_RANGE = 20

const clamp = (value, lowerBound, upperBound) => {
  'worklet'
  return Math.min(Math.max(lowerBound, value), upperBound)
}

export const Slider1 = props => {
  const { sliderText, onSlidingComplete } = props
  const translateX = useSharedValue(SLIDER_WIDTH - KNOB_WIDTH)
  const isSliding = useSharedValue(false)

  const onGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.offsetX = translateX.value
    },
    onActive: (event, ctx) => {
      isSliding.value = true
      translateX.value = clamp(event.translationX + ctx.offsetX, SLIDER_WIDTH - KNOB_WIDTH, 0)
    },
    onEnd: () => {
      isSliding.value = false

      if (translateX.value < 3) {
        // runOnJS(onSlidingComplete)()
      }
    }
  })

  const scrollTranslationStyle = useAnimatedStyle(() => {
    return { transform: [{ translateX: translateX.value }] }
  })

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + KNOB_WIDTH
    }
  })

  return (
    <View
      style={[
        { borderRadius: KNOB_WIDTH / 2, backgroundColor: '#ddd', justifyContent: 'flex-end' },
        { height: KNOB_WIDTH, width: SLIDER_WIDTH }
      ]}
    >
      <Animated.View
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: THEME.COLORS.ACCENT_MINT,
            borderRadius: KNOB_WIDTH / 2
          },
          progressStyle
        ]}
      >
        {props.showSpinner ? (
          <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={styles.activityIndicator} />
        ) : (
          <Text style={styles.textOverlay}>something</Text>
        )}
      </Animated.View>
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <Animated.View
          style={[
            {
              height: KNOB_WIDTH,
              width: KNOB_WIDTH,
              borderRadius: KNOB_WIDTH / 2,
              backgroundColor: THEME.COLORS.ACCENT_MINT,
              justifyContent: 'center',
              alignItems: 'center'
            },
            scrollTranslationStyle
          ]}
        />
      </PanGestureHandler>
    </View>
  )
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
        <PanGestureHandler onGestureEvent={onGestureEvent}>
          <Animated.View style={styles.knob} />
        </PanGestureHandler>
        {/* <NativeSlider */}
        {/*  disabled={this.props.sliderDisabled} */}
        {/*  onValueChange={this.onValueChange} */}
        {/*  onSlidingComplete={this.onSlidingComplete} */}
        {/*  minimumValue={0} */}
        {/*  maximumValue={10} */}
        {/*  value={this.state.value} */}
        {/*  style={styles.slider} */}
        {/*  thumbStyle={thumbStyle} */}
        {/*  thumbImage={leftArrowImg} */}
        {/*  minimumTrackTintColor={THEME.COLORS.TRANSPARENT} */}
        {/*  maximumTrackTintColor={THEME.COLORS.TRANSPARENT} */}
        {/*  thumbTouchSize={{ width: scale(160), height: scale(160) }} */}
        {/* /> */}

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
