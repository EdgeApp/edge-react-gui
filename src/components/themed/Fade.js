// @flow

import * as React from 'react'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

// $FlowFixMe
const { useEffect, useRef, useState } = React

type Props = {
  visible: boolean,
  hidden?: boolean,
  children: React.Node,
  onFadeoutFinish?: () => any
}

const FadeComponent = ({ visible: propsVisible, hidden, children, onFadeoutFinish = () => {} }: Props) => {
  const firstRender = useRef(true)
  const opacity = useSharedValue(0)
  const [visible, setVisible] = useState<boolean>(propsVisible)
  const [prevVisible, setPrevVisible] = useState<boolean>(propsVisible)

  if (visible !== prevVisible) setPrevVisible(visible)

  const animate = (toValue: number) => {
    if (toValue === 0.5) setVisible(true)

    opacity.value = withTiming(
      toValue,
      {
        duration: 500
      },
      onFadeoutFinish
    )
  }

  useEffect(() => animate(propsVisible ? 0.5 : 0), [])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    if (propsVisible !== prevVisible) {
      animate(propsVisible ? 0.5 : 1)
    }
  }, [propsVisible])

  const style = useAnimatedStyle(() => ({ opacity: interpolate(opacity.value, [0, 0.5, 1], [0, 1, 0]) }))

  return <Animated.View style={style}>{hidden || visible ? children : null}</Animated.View>
}

export const Fade = FadeComponent
