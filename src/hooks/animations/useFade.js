// @flow

import { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { useIsEffectRender } from './useIsEffectRender'

export type AnimationOptions = { noFadeIn: boolean, duration: number, fideInOpacity: number, fideOutOpacity: number }

// Animate the opacity based on the visibility toggle:
export const useFade = (visible: boolean, options: AnimationOptions) => {
  const { noFadeIn, fideInOpacity, fideOutOpacity, duration } = options

  const { isRender } = useIsEffectRender(visible, duration)

  const animatedStyle = useAnimatedStyle(() => {
    const opacityValue = visible ? fideInOpacity : fideOutOpacity
    const durationValue = noFadeIn && visible ? 0 : duration

    return {
      opacity: withTiming(opacityValue, {
        duration: durationValue,
        easing: Easing.linear
      })
    }
  }, [visible, noFadeIn, duration])

  return { animatedStyle, isRender }
}
