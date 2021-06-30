// @flow

import * as React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { useState } from '../../../../util/hooks'

type Props = {
  list: React.Node,
  header: React.Node,
  separator?: React.Node,
  isFetching?: boolean,
  onIsOpen?: (value: boolean) => void,
  durantionDown?: number,
  durantionOpacity?: number
}

export default function DropDownList({ list, header, separator, isFetching = false, onIsOpen, durantionDown = 300, durantionOpacity = 500 }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isShadowRender, setIsShadowRender] = useState(true)
  const [listHeight, setListHeight] = useState(-1)

  const height = useSharedValue()
  const opacity = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(height.value, {
        duration: durantionDown,
        easing: Easing.linear
      }),
      opacity: withTiming(opacity.value, {
        duration: durantionOpacity,
        easing: Easing.linear
      })
    }
  })

  const onPress = e => {
    if (isFetching) return null

    isOpen ? (height.value = 0) : (height.value = listHeight)
    isOpen ? (opacity.value = 0) : (opacity.value = 1)

    setIsOpen(!isOpen)

    if (onIsOpen) {
      onIsOpen(!isOpen)
    }
  }

  const onLayout = e => {
    if (!isFetching && listHeight === -1) {
      setListHeight(e.nativeEvent.layout.height)
      height.value = 0

      setTimeout(() => {
        setIsShadowRender(false)
      }, 500)
    }
  }

  const viewStyle = isShadowRender ? styles.hide : styles.show

  return (
    <View>
      <Pressable onPress={onPress}>
        <View>{header}</View>
      </Pressable>
      {separator || null}
      <Animated.View style={[viewStyle, animatedStyle]} onLayout={onLayout}>
        {list}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  hide: {
    opacity: 0,
    position: 'absolute',
    zIndex: -1
  },
  show: {
    opacity: 1
  }
})
