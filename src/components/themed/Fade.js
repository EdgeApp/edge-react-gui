// @flow
import * as React from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

type Props = {
  children?: React.Node,

  // True to make the contents of the fade visible:
  visible: boolean,

  // Animation duration, in ms:
  duration?: number,

  // No fade in animation on first render:
  noFadeIn?: boolean,

  // Final opacity
  opacity?: number,

  // Fade in style
  style?: any
}

const useFadeAnimation = (visible: boolean, options: { noFadeIn?: boolean, duration?: number }) => {
  const { noFadeIn = false, duration = 500 } = options

  const opacity = useSharedValue(noFadeIn || visible ? 1 : 0)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: (opacity.value = withTiming(visible ? 1 : 0, { duration, easing: Easing.linear }))
    }
  })

  return animatedStyle
}

export const Fade = ({ children, duration, visible, noFadeIn, opacity, style }: Props) => {
  const animatedStyle = useFadeAnimation(visible, { noFadeIn, duration })

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
}
