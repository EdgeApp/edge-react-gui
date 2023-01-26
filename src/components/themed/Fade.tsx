import * as React from 'react'
import Animated from 'react-native-reanimated'

import { useFadeAnimation } from '../../hooks/animations/useFadeAnimation'

interface Props {
  children: React.ReactNode

  // True to make the contents visible:
  visible: boolean

  // Animation duration, in ms:
  duration?: number

  // Delay before beginning the animation, in ms:
  delay?: number

  // No fade in animation on first render:
  noFadeIn?: boolean
}

export const Fade = ({ children, duration, delay, visible, noFadeIn }: Props) => {
  const style = useFadeAnimation(visible, { noFadeIn, duration, delay })

  return (
    <Animated.View style={style} pointerEvents={visible ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  )
}
