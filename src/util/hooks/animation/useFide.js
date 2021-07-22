// @flow

import { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated'

import useIsEffectRender from './useIsEffectRender'

export const useFide = (isFide: boolean, fideIn: number = 1, fideOut: number = 0, duration: number = 200) => {
  const { isRender } = useIsEffectRender(isFide, duration)

  const animatedStyle = useAnimatedStyle(() => {
    const opacityValue = isFide ? fideIn : fideOut

    return {
      opacity: withTiming(opacityValue, {
        duration,
        easing: Easing.linear
      })
    }
  }, [isFide])

  return {
    animatedStyle,
    isRender
  }
}

export default useFide
