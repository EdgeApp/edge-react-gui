// @flow

import * as React from 'react'
import Animated from 'react-native-reanimated'

import { useFadeAnimation } from '../../hooks/animations/useFadeAnimation'

type Props = {
  children: React.Node,

  // True to make the contents visible:
  visible: boolean,

  // Animation duration, in ms:
  duration?: number,

  // No fade in animation on first render:
  noFadeIn?: boolean
}

export const Fade = ({ children, duration, visible, noFadeIn }: Props) => {
  const style = useFadeAnimation(visible, { noFadeIn, duration })

  return (
    <Animated.View style={style} pointerEvents={visible ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  )
}
