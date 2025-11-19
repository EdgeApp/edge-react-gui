import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import Entypo from 'react-native-vector-icons/Entypo'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { triggerHaptic } from '../../util/haptic'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

const COMPLETE_POINT: number = 3

interface Props {
  onSlidingComplete: (reset: () => void) => Promise<void> | void
  parentStyle?: any
  width?: number

  // Disabled logic:
  disabledText?: string
  disabled: boolean
}

export const SafeSlider: React.FC<Props> = props => {
  const {
    disabledText,
    disabled = false,
    onSlidingComplete,
    parentStyle
  } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const { confirmationSliderThumbWidth } = theme
  const [completed, setCompleted] = React.useState(false)

  const { width = theme.confirmationSliderWidth } = props
  const upperBound = width - theme.confirmationSliderThumbWidth
  const widthStyle = { width }
  const sliderDisabled = disabled || completed
  const sliderText = !sliderDisabled
    ? lstrings.send_confirmation_slide_to_confirm
    : disabledText ?? lstrings.select_exchange_amount_short

  const translateX = useSharedValue(upperBound)

  const resetSlider = useHandler(() => {
    translateX.value = withTiming(upperBound, {
      duration: 500,
      easing: Easing.inOut(Easing.exp)
    })
    setCompleted(false)
  })
  const handleComplete = (): void => {
    setCompleted(true)
    triggerHaptic('impactMedium')
    onSlidingComplete(() => {
      resetSlider()
    })?.catch((err: unknown) => {
      showError(err)
    })
  }

  const gesture = Gesture.Pan()
    .enabled(!sliderDisabled)
    .onChange(event => {
      translateX.value = Math.max(
        0,
        // We start at `upperBound` and translate left,
        // so `event.translationX` should be negative:
        upperBound + Math.min(0, event.translationX)
      )
    })
    .onEnd(event => {
      if (translateX.value < COMPLETE_POINT) {
        runOnJS(handleComplete)()
      } else {
        translateX.value = withTiming(upperBound, {
          duration: 500,
          easing: Easing.inOut(Easing.exp)
        })
      }
    })

  const scrollTranslationStyle = useAnimatedStyle(() => {
    return { transform: [{ translateX: translateX.value }] }
  })

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + confirmationSliderThumbWidth
    }
  })

  return (
    <View style={[parentStyle, styles.sliderContainer]}>
      <View
        style={[
          styles.slider,
          sliderDisabled ? styles.disabledSlider : null,
          widthStyle
        ]}
      >
        <Animated.View style={[styles.progress, progressStyle]} />

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.thumb,
              sliderDisabled ? styles.disabledThumb : null,
              scrollTranslationStyle
            ]}
          >
            <Entypo
              style={styles.thumbIcon}
              name="chevron-left"
              size={theme.rem(1.5)}
            />
          </Animated.View>
        </GestureDetector>
        {completed ? (
          <ActivityIndicator
            color={theme.iconTappable}
            style={styles.activityIndicator}
          />
        ) : (
          <EdgeText
            style={
              sliderDisabled
                ? [styles.textOverlay, styles.textOverlayDisabled]
                : styles.textOverlay
            }
          >
            {sliderText}
          </EdgeText>
        )}
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  sliderContainer: {
    alignItems: 'center'
  },
  slider: {
    borderRadius: theme.confirmationSliderThumbWidth / 2,
    backgroundColor: theme.confirmationSliderCompleted,
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
