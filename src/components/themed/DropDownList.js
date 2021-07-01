// @flow

import * as React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { useEffect, useState } from '../../util/hooks'

type Props = {
  list: React.Node,
  header: React.Node,
  separator?: React.Node,
  isFetching?: boolean,
  onIsOpen?: (value: boolean) => void,
  durantionDown?: number,
  durantionOpacity?: number,
  forceClose?: boolean
}

export default function DropDownList({
  list,
  header,
  separator,
  isFetching = false,
  onIsOpen,
  durantionDown = 300,
  durantionOpacity = 100,
  forceClose = false
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isShadowRender, setIsShadowRender] = useState(true)
  const [listHeight, setListHeight] = useState(-1)

  const height = useSharedValue()
  const opacity = useSharedValue(0)
  console.debug('FORCE CLOCE', forceClose)

  useEffect(() => {
    if (forceClose && listHeight !== -1) {
      toggleState(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceClose])

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

  const toggleState = (isOpenValue: boolean) => {
    isOpenValue ? (height.value = 0) : (height.value = listHeight)
    isOpenValue ? (opacity.value = 0) : (opacity.value = 1)

    setIsOpen(!isOpenValue)

    if (onIsOpen) onIsOpen(!isOpenValue)
  }

  const onPress = () => {
    if (isFetching) return null

    toggleState(isOpen)
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
