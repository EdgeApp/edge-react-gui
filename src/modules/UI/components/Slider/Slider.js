// @flow

import * as React from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { PanGestureHandler } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import leftArrowImg from '../../../../assets/images/slider/keyboard-arrow-left.png'
import s from '../../../../locales/strings.js'
import { THEME } from '../../../../theme/variables/airbitz.js'
import { PLATFORM } from '../../../../theme/variables/platform.js'

type Props = {
  onSlidingComplete(): mixed,
  parentStyle?: any,
  showSpinner?: boolean,

  // Reset logic:
  reset?: boolean,

  // Disabled logic:
  disabledText?: string,
  disabled: boolean
}

const SLIDER_WIDTH = PLATFORM.deviceWidth >= 720 ? 680 : PLATFORM.deviceWidth - 45
const KNOB_WIDTH = 55
const UPPER_BOUND = SLIDER_WIDTH - KNOB_WIDTH

const clamp = (value, lowerBound, upperBound) => {
  'worklet'
  return Math.min(Math.max(lowerBound, value), upperBound)
}

export const Slider = (props: Props) => {
  const { disabledText, disabled, reset, showSpinner, onSlidingComplete, parentStyle } = props
  const sliderDisabled = disabled || showSpinner
  const sliderText = !sliderDisabled ? s.strings.send_confirmation_slide_to_confirm : disabledText || s.strings.select_exchange_amount_short
  const translateX = useSharedValue(UPPER_BOUND)
  const isSliding = useSharedValue(false)

  if (reset) translateX.value = withTiming(UPPER_BOUND)

  const disabledOnGestureEvent = () => null
  const onGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.offsetX = translateX.value
    },
    onActive: (event, ctx) => {
      isSliding.value = true
      translateX.value = clamp(event.translationX + ctx.offsetX, 0, UPPER_BOUND)
    },
    onEnd: () => {
      isSliding.value = false

      if (translateX.value < 3) {
        // runOnJS(fff)()
        runOnJS(onSlidingComplete)()
      } else {
        translateX.value = withTiming(UPPER_BOUND)
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
    <View style={[parentStyle, styles.slider, showSpinner || sliderDisabled ? styles.disabledSlider : null]}>
      <Animated.View style={[styles.progress, progressStyle]} />
      <PanGestureHandler onGestureEvent={sliderDisabled || showSpinner ? disabledOnGestureEvent : onGestureEvent}>
        <Animated.View style={[styles.thumb, sliderDisabled || showSpinner ? styles.disabledThumb : null, scrollTranslationStyle]}>
          <Image source={leftArrowImg} />
        </Animated.View>
      </PanGestureHandler>
      {showSpinner ? (
        <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={styles.activityIndicator} />
      ) : (
        <Text style={styles.textOverlay}>{sliderText}</Text>
      )}
    </View>
  )
}

const rawStyles = {
  slider: {
    borderRadius: KNOB_WIDTH / 2,
    backgroundColor: THEME.COLORS.OPACITY_WHITE,
    justifyContent: 'center',
    height: KNOB_WIDTH,
    width: SLIDER_WIDTH
  },
  disabledSlider: {
    backgroundColor: THEME.COLORS.OPACITY_GRAY_1
  },
  thumb: {
    height: KNOB_WIDTH,
    width: KNOB_WIDTH,
    borderRadius: KNOB_WIDTH / 2,
    backgroundColor: THEME.COLORS.ACCENT_MINT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5
  },
  disabledThumb: {
    backgroundColor: THEME.COLORS.GRAY_2
  },
  progress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.COLORS.OPACITY_WHITE,
    borderRadius: KNOB_WIDTH / 2
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
