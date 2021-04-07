// @flow

import * as React from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { PanGestureHandler } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import leftArrowImg from '../../../../assets/images/slider/keyboard-arrow-left.png'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../../components/services/ThemeContext.js'
import s from '../../../../locales/strings.js'

const COMPLETE_POINT: number = 3

type OwnProps = {
  onSlidingComplete(): mixed,
  parentStyle?: any,
  showSpinner?: boolean,
  completePoint?: number,
  width?: number,
  thumbWidth: number,

  // Reset logic:
  reset?: boolean,

  // Disabled logic:
  disabledText?: string,
  disabled: boolean
}

type Props = OwnProps & ThemeProps

const clamp = (value, lowerBound, upperBound) => {
  'worklet'
  return Math.min(Math.max(lowerBound, value), upperBound)
}

export const SliderComponent = (props: Props) => {
  const {
    disabledText,
    disabled,
    reset,
    showSpinner,
    onSlidingComplete,
    parentStyle,
    completePoint = COMPLETE_POINT,
    theme,
    thumbWidth = props.theme.confirmationSliderThumbWidth,
    width = props.theme.confirmationSliderWidth
  } = props
  const styles = getStyles(theme, width, thumbWidth)
  const upperBound = width - thumbWidth

  const sliderDisabled = disabled || showSpinner
  const sliderText = !sliderDisabled ? s.strings.send_confirmation_slide_to_confirm : disabledText || s.strings.select_exchange_amount_short
  const translateX = useSharedValue(upperBound)
  const isSliding = useSharedValue(false)

  if (reset) translateX.value = withTiming(upperBound)

  const onGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      if (!sliderDisabled) ctx.offsetX = translateX.value
    },
    onActive: (event, ctx) => {
      if (!sliderDisabled) {
        isSliding.value = true
        translateX.value = clamp(event.translationX + ctx.offsetX, 0, upperBound)
      }
    },
    onEnd: () => {
      if (!sliderDisabled) {
        isSliding.value = false

        if (translateX.value < completePoint) {
          runOnJS(onSlidingComplete)()
        } else {
          translateX.value = withTiming(upperBound)
        }
      }
    }
  })

  const scrollTranslationStyle = useAnimatedStyle(() => {
    return { transform: [{ translateX: translateX.value }] }
  })

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + thumbWidth
    }
  })

  return (
    <View style={[parentStyle, styles.slider, sliderDisabled ? styles.disabledSlider : null]}>
      <Animated.View style={[styles.progress, progressStyle]} />

      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <Animated.View style={[styles.thumb, sliderDisabled ? styles.disabledThumb : null, scrollTranslationStyle]}>
          <Image source={leftArrowImg} />
        </Animated.View>
      </PanGestureHandler>
      {showSpinner ? (
        <ActivityIndicator color={theme.iconTappable} style={styles.activityIndicator} />
      ) : (
        <Text style={sliderDisabled ? [styles.textOverlay, styles.textOverlayDisabled] : styles.textOverlay}>{sliderText}</Text>
      )}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme, { sliderWidth, thumbWidth }: { sliderWidth?: number, thumbWidth?: number }) => {
  sliderWidth = sliderWidth || theme.confirmationSliderWidth
  thumbWidth = thumbWidth || theme.confirmationSliderThumbWidth
  return {
    slider: {
      borderRadius: thumbWidth / 2,
      backgroundColor: theme.confirmationSlider,
      justifyContent: 'center',
      height: thumbWidth,
      width: sliderWidth
    },
    disabledSlider: {
      backgroundColor: theme.confirmationSlider
    },
    thumb: {
      height: thumbWidth,
      width: thumbWidth,
      borderRadius: thumbWidth / 2,
      backgroundColor: theme.confirmationSliderThumb,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5
    },
    disabledThumb: {
      backgroundColor: theme.confirmationThumbDeactivated
    },
    progress: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.confirmationSlider,
      borderRadius: thumbWidth / 2
    },
    textOverlay: {
      fontSize: theme.rem(0.75),
      position: 'absolute',
      color: theme.confirmationSliderText,
      alignSelf: 'center',
      top: theme.rem(1),
      zIndex: 1
    },
    textOverlayDisabled: {
      color: theme.confirmationSliderTextDeactivated
    },
    activityIndicator: {
      position: 'absolute',
      alignSelf: 'center',
      top: theme.rem(1),
      zIndex: 1
    }
  }
})

export const Slider = withTheme(SliderComponent)
