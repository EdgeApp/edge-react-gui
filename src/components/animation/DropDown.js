// @flow

import * as React from 'react'
import { StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'

import { useDropDown } from '../../util/hooks'

const DropDown = ({ children, style, isOpen }: { children?: React.Node, style?: StyleSheet.Styles, isOpen: boolean }) => {
  const { animatedStyle, onLayout, isRender } = useDropDown(isOpen)

  return isRender ? (
    <Animated.View style={[styles.root, animatedStyle]} onLayout={onLayout}>
      {children}
    </Animated.View>
  ) : null
}

export default DropDown

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden'
  }
})
