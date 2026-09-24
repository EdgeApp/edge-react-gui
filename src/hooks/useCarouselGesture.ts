import { Platform } from 'react-native'
import { Gesture, type PanGesture } from 'react-native-gesture-handler'
import {
  type SharedValue,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'

import { useTheme } from '../components/services/ThemeContext'

/**
 * Creates a gesture and animated value for managing a carousel.
 * The animated value goes from 0 to itemCount -1.
 */
export const useCarouselGesture = (
  itemCount: number,
  itemWidth: number,
  onGestureEnd?: (index: number) => void
): {
  gesture: PanGesture
  scrollIndex: SharedValue<number>
} => {
  const theme = useTheme()
  const activateThreshold = theme.rem(0.5)
  const completeThreshold = theme.rem(2)

  const itemScale = itemWidth === 0 ? 0 : 1 / itemWidth

  const scrollIndex = useSharedValue(0)
  const startIndex = useSharedValue(0)
  const gesture = Gesture.Pan()
    .activeOffsetX([-activateThreshold, activateThreshold])
    .onBegin(() => {
      startIndex.value = scrollIndex.value
    })
    .onUpdate(event => {
      scrollIndex.value = startIndex.value - itemScale * event.translationX
    })
    .onEnd(event => {
      // Did we complete the gesture?
      const delta =
        event.translationX > completeThreshold
          ? -1
          : event.translationX < -completeThreshold
          ? 1
          : 0

      // Snap to the nearest offset, with clamping:
      const destValue = Math.max(
        0,
        Math.min(itemCount - 1, startIndex.value + delta)
      )
      scrollIndex.value = withSpring(
        destValue,
        Platform.OS === 'android'
          ? { damping: 12 } // Old Reanimated 3 algorithm
          : {
              velocity: -itemScale * event.velocityX,
              stiffness: 900,
              damping: 100
            }
      )

      if (onGestureEnd != null) runOnJS(onGestureEnd)(destValue)
    })

  return { gesture, scrollIndex }
}
