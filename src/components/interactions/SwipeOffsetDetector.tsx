import * as React from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { SharedValue, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { useTheme } from '../services/ThemeContext'

interface Props {
  children: React.ReactNode
  swipeOffset: SharedValue<number>
  maxOffset?: number
  minOffset?: number
}

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
  const { children, maxOffset, minOffset, swipeOffset } = props
  const theme = useTheme()
  const { width: screenWidth } = useSafeAreaFrame()
  const offsetStart = useSharedValue(0)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-theme.rem(1.5), theme.rem(1.5)])
    .onBegin(_ => {
      offsetStart.value = swipeOffset.value
    })
    .onUpdate(e => {
      // Subtract to make the value positive and to make calculations easier
      swipeOffset.value = offsetStart.value - e.translationX / screenWidth
    })
    .onEnd(_ => {
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
    })

  return <GestureDetector gesture={panGesture}>{children}</GestureDetector>
}
