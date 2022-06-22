// @flow

import * as React from 'react'
import { StyleSheet } from 'react-native'
import Animated, { type SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'

type Props = {|
  children?: React.Node,

  // The `SwipeableRow` provides this animated value:
  isActive: SharedValue<boolean>,

  // Use this to align with the swipe detent:
  minWidth?: number
|}

/**
 * Renders an expanding icon for use in a `SwipeableRow`.
 *
 * The only reason this needs to be a component is to get access
 * to the `useAnimatedStyle` hook, so we keep the features minimal here.
 */
export function SwipeableRowIcon(props: Props) {
  const { children, isActive, minWidth } = props

  const style = useAnimatedStyle(() => ({
    minWidth,
    transform: [{ scale: withTiming(isActive.value ? 1.5 : 1) }]
  }))
  return <Animated.View style={[styles.center, style]}>{children}</Animated.View>
}

const rawStyles = {
  center: {
    alignItems: 'center',
    justifyContent: 'center'
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
