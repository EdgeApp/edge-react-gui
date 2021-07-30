// @flow

import { Easing, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

export const useBlinkAnimation = (duration?: number = 500) => {
  return useAnimatedStyle(
    () => ({
      opacity: withRepeat(
        withSequence(withTiming(1, { duration, easing: Easing.in(Easing.exp) }), withTiming(0, { duration, easing: Easing.out(Easing.exp) })),
        -1
      )
    }),
    [duration]
  )
}
