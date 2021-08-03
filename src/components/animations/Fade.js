// @flow

import * as React from 'react'
import { StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'

import { useFade } from '../../hooks/animations/useFade'

type Props = {
  children?: React.Node,

  // True to make the contents visible:
  visible: boolean,

  // Animation duration, in ms:
  duration?: number,

  // No fade in animation on first render:
  noFadeIn?: boolean,

  // Unmount component after fide out:
  isUnmount?: boolean,

  fideInOpacity?: number,

  fideOutOpacity?: number,

  style?: StyleSheet.Styles
}

export const Fade = (props: Props) => {
  const { children, duration = 500, visible, noFadeIn = false, fideInOpacity = 1, fideOutOpacity = 0, isUnmount = false, style } = props

  const { animatedStyle, isRender } = useFade(visible, { noFadeIn, duration, fideInOpacity, fideOutOpacity, isUnmount })

  const AnimatedView = (
    <Animated.View style={[style, animatedStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  )

  if (isUnmount) {
    return isRender ? AnimatedView : null
  }

  return AnimatedView
}
