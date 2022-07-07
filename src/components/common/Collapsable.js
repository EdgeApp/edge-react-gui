// @flow

import * as React from 'react'
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { useTheme } from '../services/ThemeContext'

const TIME_SCALE = 750

type Props = {
  minHeightRem: number,
  maxHeightRem?: number,
  duration?: number,
  isCollapsed: boolean,
  children: React.Node
}

export function Collapsable(props: Props) {
  const { minHeightRem, maxHeightRem = minHeightRem, isCollapsed, duration = TIME_SCALE, children } = props
  const theme = useTheme()

  const minHeight = theme.rem(minHeightRem)
  const maxHeight = theme.rem(maxHeightRem)

  const heightAnimation = useAnimatedStyle(() => ({
    height: withTiming(isCollapsed ? minHeight : maxHeight, { duration, easing: Easing.out(Easing.exp) })
  }))

  return <Animated.View style={heightAnimation}>{children}</Animated.View>
}
