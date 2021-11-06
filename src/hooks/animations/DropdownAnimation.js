// @flow

import * as React from 'react'
import { StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'

import { useDropDown } from './useDropDown'

type Props = { children?: React.Node, style?: StyleSheet.Styles, isOpen: boolean }

export const DropdownAnimation = ({ children, style, isOpen }: Props) => {
  const { animatedStyle, onLayout, isRender } = useDropDown(isOpen)

  return isRender ? (
    <Animated.View style={[styles.root, animatedStyle]} onLayout={onLayout}>
      {children}
    </Animated.View>
  ) : null
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden'
  }
})
