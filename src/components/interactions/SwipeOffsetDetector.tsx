import * as React from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { SharedValue, useSharedValue, withDecay, WithDecayConfig, withSpring } from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { useTheme } from '../services/ThemeContext'

interface Props {
  children: React.ReactNode
  swipeOffset: SharedValue<number>
  maxOffset?: number
  minOffset?: number
}

// This adjust the velocity just enough to make it feel right.
const VELOCITY_INCREASE_FACTOR = 3 / 2

/**
 * Detect swipe gestures on child components, and update the `swipeOffset` to
 * the current swipe offset.
 *
 * The assumption is that this component will allow for specific gesture areas
 * to be defined within a scene (a full-screen areas, or isolated to some
 * scene components). The children components will detect the gesture, like
 * TouchableOpacity, Pressable, etc.
 *
 * The swipe offset will snap to discreet integers starting at zero and increase
 * or decrease based on the swipe direction. The offset will be bounded by the
 * optional minOffset and maxOffset parameters.
 *
 * This component should commonly be used along with a pagination component with
 * the scene. This pagination communicates to the user the current offset.
 */

export const SwipeOffsetDetector = (props: Props) => {
  const { children, maxOffset = Infinity, minOffset = -Infinity, swipeOffset } = props
  const theme = useTheme()
  const { width: screenWidth } = useSafeAreaFrame()
  const offsetStart = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .activeOffsetX([-theme.rem(1.5), theme.rem(1.5)])
    .onBegin(_ => {
      offsetStart.value = swipeOffset.value
    })
    .onUpdate(e => {
      swipeOffset.value = offsetStart.value - e.translationX / screenWidth
    })
    .onEnd(e => {
      // Convert the velocity to a ratio of the screen width.
      const screenVelocity = (e.velocityX / screenWidth) * VELOCITY_INCREASE_FACTOR
      const inertiaConfig: WithDecayConfig = {
        // Negate velocity because swipe direction is an inverse to gesture direction
        velocity: -screenVelocity,
        deceleration: 0.95 // Decelerate by 5%
      }

      swipeOffset.value = withDecay(inertiaConfig, finished => {
        if (finished) {
          let destValue: number
          if (minOffset != null && swipeOffset.value < minOffset) {
            destValue = minOffset
          } else if (maxOffset != null && swipeOffset.value > maxOffset) {
            destValue = maxOffset
          } else {
            // Snap to the nearest offset:
            destValue = Math.round(swipeOffset.value)
          }
          swipeOffset.value = withSpring(destValue, { damping: 15 })
        }
      })
    })

  return <GestureDetector gesture={panGesture}>{children}</GestureDetector>
}
