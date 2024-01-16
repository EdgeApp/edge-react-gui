import * as React from 'react'
import { Dimensions } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { Gesture, GestureDetector, TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { cacheStyles } from 'react-native-patina'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { Theme, useTheme } from '../services/ThemeContext'

const safeAreaGap = 256 // Overkill to avoid top of screen
const duration = 300

interface Props {
  bridge: AirshipBridge<void>
  children: React.ReactNode

  backgroundColor: string

  // Determines how long the dropdown remains visible,
  // or 0 to disable auto-hide:
  autoHideMs?: number

  // Called when the user taps anywhere in the dropdown.
  // Defaults to hiding the dropdown.
  onPress?: () => void
}

/**
 * A notification that slides down from the top of the screen.
 */
export function AirshipDropdown(props: Props): JSX.Element {
  const { autoHideMs = 5000, backgroundColor, bridge, children, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // The user must drag this far to close the drop-down:
  const closeThreshold = theme.rem(1.5)

  // The drop-down can pull down by this amount.
  // This doesn't do anything, but it feels nicer to the user:
  const dragSlop = theme.rem(1)

  //
  // Shared state
  //

  const offset = useSharedValue(-Dimensions.get('window').height / 4)
  const timeout = React.useRef<ReturnType<typeof setTimeout>>()
  const handleClose = useHandler(() => props.bridge.resolve())

  //
  // Effects
  //

  React.useEffect(() => {
    bridge.on('clear', handleClose)
  }, [bridge, handleClose])

  React.useEffect(() => {
    // Animate in:
    offset.value = withTiming(0, { duration })

    // Animate out:
    return bridge.on('result', () => {
      const hiddenOffset = -Dimensions.get('window').height / 4
      offset.value = withTiming(hiddenOffset, { duration }, () => {
        runOnJS(bridge.remove)()
      })
    })
  }, [bridge, offset])

  React.useEffect(() => {
    if (autoHideMs > 0) {
      timeout.current = setTimeout(() => {
        timeout.current = undefined
        handleClose()
      }, autoHideMs + duration)
    }
    return () => {
      if (timeout.current != null) clearTimeout(timeout.current)
    }
  }, [autoHideMs, handleClose])

  //
  // Gesture handling
  //

  const stopTimer = useHandler(() => {
    if (timeout.current != null) {
      clearTimeout(timeout.current)
      timeout.current = undefined
    }
  })

  const gesture = Gesture.Pan()
    .onUpdate(e => {
      offset.value = e.translationY
    })
    .onEnd(() => {
      if (offset.value < -closeThreshold) {
        runOnJS(handleClose)()
      }
      runOnJS(stopTimer)()
      offset.value = withTiming(0, { duration })
    })

  //
  // Dynamic styles
  //

  const bodyStyle = useAnimatedStyle(() => ({
    backgroundColor,
    transform: [{ translateY: Math.min(dragSlop, offset.value) }]
  }))

  return (
    <GestureDetector gesture={gesture}>
      <TouchableWithoutFeedback onPress={onPress ?? handleClose}>
        <Animated.View style={[styles.body, bodyStyle]}>{children}</Animated.View>
      </TouchableWithoutFeedback>
    </GestureDetector>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const borderRadius = theme.rem(1 / 4)
  return {
    body: {
      // Layout:
      flexShrink: 1,
      paddingTop: safeAreaGap,
      marginTop: -safeAreaGap,
      width: theme.rem(32),

      // Visuals:
      borderBottomLeftRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
      shadowOpacity: 1,
      shadowOffset: {
        height: 0,
        width: 0
      },
      shadowRadius: theme.rem(1 / 4),

      // Children:
      alignItems: 'stretch',
      flexDirection: 'column',
      justifyContent: 'flex-start'
    }
  }
})
