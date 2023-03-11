import * as React from 'react'
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'

// Animate the opacity based on the visibility toggle:
export const useFadeAnimation = (visible: boolean, options: { noFadeIn?: boolean; duration?: number; delay?: number }) => {
  const { noFadeIn = false, duration = 500, delay = 0 } = options

  const firstRender = React.useRef<boolean>(true)
  const opacity = useSharedValue(noFadeIn ? 1 : 0)
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value
  }))

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    opacity.value = withDelay(delay, withTiming(visible ? 1 : 0, { duration }))
  }, [duration, opacity, visible, delay])

  return style
}
