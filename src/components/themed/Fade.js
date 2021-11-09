// @flow
import * as React from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { useEffect, useRef } from '../../types/reactHooks'
import { useTheme } from '../services/ThemeContext'
type Props = {
  children: React.Node,

  // True to make the contents visible:
  visible: boolean,

  // Animation duration, in ms:
  duration?: number,

  // No fade in animation on first render:
  noFadeIn?: boolean
}

const useFadeAnimation = (visible: boolean, options: { noFadeIn?: boolean, duration?: number }) => {
  const { noFadeIn = false, duration = 500 } = options
  const theme = useTheme()
  const twoRem = theme.rem(2)

  // const firstRender = useRef<boolean>(true) // What's the point?
  const opacity = useSharedValue(noFadeIn ? 1 : 0)
  const style = useAnimatedStyle(() => {
    return {
      opacity: (opacity.value = withTiming(visible ? 1 : 0, { duration }))
      // opacity: (opacity.value = withTiming(visible ? 1 : 0, { duration })),
      // backgroundColor: '#87939E',
      // position: 'absolute',
      // zIndex: 1,
      // top: 0,
      // left: 0,
      // right: 0,
      // bottom: 0,
      // borderTopLeftRadius: twoRem,
      // borderBottomLeftRadius: twoRem
    }
  })

  useEffect(() => {
    // if (firstRender.current) {
    //   firstRender.current = false
    //   return
    // }
    // opacity.value = withTiming(visible ? 1 : 0, { duration })
  }, [duration, opacity, visible])

  return style
}

export const Fade = ({ children, duration, visible, noFadeIn }: Props) => {
  const style = useFadeAnimation(visible, { noFadeIn, duration })

  const theme = useTheme()
  const twoRem = theme.rem(2)
  const testStyle = {
    backgroundColor: '#87939E',
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: twoRem,
    borderBottomLeftRadius: twoRem
  }

  return (
    <Animated.View style={[testStyle, style]} pointerEvents={visible ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  )
}
