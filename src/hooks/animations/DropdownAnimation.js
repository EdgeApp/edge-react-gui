// @flow

import * as React from 'react'
import { StyleSheet } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { useState } from '../../types/reactHooks'

const useDropDown = (isOpen: boolean, duration: number = 500, durantionOpacity: number = 200) => {
  const [maxHeight, setMaxHeight] = useState(0)
  const height = useSharedValue(isOpen ? maxHeight : 0)

  const measureMaxHeight = (e: any) => {
    setMaxHeight(e.nativeEvent.layout.heightValue)
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: (height.value = withTiming(isOpen ? 0 : maxHeight, {
        duration: duration,
        easing: Easing.linear
      }))
    }
  }, [isOpen])

  return {
    animatedStyle,
    measureMaxHeight
  }
}
type Props = { children?: React.Node, style?: StyleSheet.Styles, isOpen: boolean }

export const DropdownAnimation = ({ children, style, isOpen }: Props) => {
  const { animatedStyle, measureMaxHeight } = useDropDown(isOpen)
  console.log('animatedStyle.height: ', animatedStyle.height)

  return (
    <Animated.View style={[styles.root, animatedStyle]} onLayout={measureMaxHeight}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden'
  }
})
