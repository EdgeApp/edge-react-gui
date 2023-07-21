import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { PanGestureHandler } from 'react-native-gesture-handler'
import Animated, { Easing, runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Entypo from 'react-native-vector-icons/Entypo'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { triggerHaptic } from '../../util/haptic'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

const COMPLETE_POINT: number = 3

interface Props {
  onSlidingComplete: (reset: () => void) => Promise<void> | void
  parentStyle?: any
  completePoint?: number
  width?: number

  // Disabled logic:
  disabledText?: string
  disabled: boolean
}

export const SafeSlider = (props: Props) => {
  const { disabledText, disabled, onSlidingComplete, parentStyle, completePoint = COMPLETE_POINT } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const [completed, setCompleted] = React.useState(false)

  const { width = theme.confirmationSliderWidth } = props
  const upperBound = width - theme.confirmationSliderThumbWidth
  const widthStyle = { width }
  const sliderDisabled = disabled || completed
  const sliderText = !sliderDisabled ? lstrings.send_confirmation_slide_to_confirm : disabledText || lstrings.select_exchange_amount_short

  const translateX = useSharedValue(upperBound)
  const isSliding = useSharedValue(false)

  const resetSlider = useHandler(() => {
    translateX.value = withTiming(upperBound, {
      duration: 500,
      easing: Easing.inOut(Easing.exp)
    })
    setCompleted(false)
  })
  const complete = () => {
    triggerHaptic('impactMedium')
    onSlidingComplete(() => resetSlider())?.catch(err => showError(err))
    setCompleted(true)
  }

  const onGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      // @ts-expect-error
      if (!sliderDisabled) ctx.offsetX = translateX.value
    },
    onActive: (event, ctx) => {
      if (!sliderDisabled) {
        isSliding.value = true
        // @ts-expect-error
        translateX.value = clamp(event.translationX + ctx.offsetX, 0, upperBound)
      }
    },
    onEnd: () => {
      if (!sliderDisabled) {
        isSliding.value = false

        if (translateX.value < completePoint) {
          runOnJS(complete)()
        } else {
          translateX.value = withTiming(upperBound, {
            duration: 500,
            easing: Easing.inOut(Easing.exp)
          })
        }
      }
    }
  })

  const scrollTranslationStyle = useAnimatedStyle(() => {
    return { transform: [{ translateX: translateX.value }] }
  })

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + theme.confirmationSliderThumbWidth
    }
  })

  return (
    <View style={[parentStyle, styles.sliderContainer]}>
      <View style={[styles.slider, sliderDisabled ? styles.disabledSlider : null, widthStyle]}>
        <Animated.View style={[styles.progress, progressStyle]} />

        <PanGestureHandler onGestureEvent={onGestureEvent}>
          <Animated.View style={[styles.thumb, sliderDisabled ? styles.disabledThumb : null, scrollTranslationStyle]}>
            <Entypo style={styles.thumbIcon} name="chevron-left" size={theme.rem(1.5)} />
          </Animated.View>
        </PanGestureHandler>
        {completed ? (
          <ActivityIndicator color={theme.iconTappable} style={styles.activityIndicator} />
        ) : (
          <EdgeText style={sliderDisabled ? [styles.textOverlay, styles.textOverlayDisabled] : styles.textOverlay}>{sliderText}</EdgeText>
        )}
      </View>
    </View>
  )
}

type Clamp = (value: number, lowerBound: number, upperBound: number) => number

const clamp: Clamp = (value, lowerBound, upperBound) => {
  'worklet'
  return Math.min(Math.max(lowerBound, value), upperBound)
}

const getStyles = cacheStyles((theme: Theme) => ({
  sliderContainer: {
    alignItems: 'center'
  },
  slider: {
    borderRadius: theme.confirmationSliderThumbWidth / 2,
    backgroundColor: theme.confirmationSlider,
    justifyContent: 'center',
    height: theme.confirmationSliderThumbWidth,
    width: theme.confirmationSliderWidth
  },
  disabledSlider: {
    backgroundColor: theme.confirmationSlider
  },
  thumb: {
    height: theme.confirmationSliderThumbWidth,
    width: theme.confirmationSliderThumbWidth,
    borderRadius: theme.confirmationSliderThumbWidth / 2,
    backgroundColor: theme.confirmationSliderThumb,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5
  },
  thumbIcon: {
    color: theme.confirmationSliderArrow,
    fontSize: theme.rem(2.25)
  },
  disabledThumb: {
    backgroundColor: theme.confirmationThumbDeactivated
  },
  progress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.confirmationSlider,
    borderRadius: theme.confirmationSliderThumbWidth / 2
  },
  textOverlay: {
    fontSize: theme.rem(0.75),
    position: 'absolute',
    color: theme.confirmationSliderText,
    alignSelf: 'center',
    lineHeight: theme.confirmationSliderThumbWidth,
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
}))
