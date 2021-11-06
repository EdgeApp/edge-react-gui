// @flow

import { StyleSheet } from 'react-native'
import { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { useState } from '../../types/reactHooks'
import { useIsEffectRender } from './useIsEffectRender'

export const useDropDown = (isOpen: boolean, durantionDown: number = 200, durantionOpacity: number = 200) => {
  const [listHeight, setListHeight] = useState(-1)
  const [isShadowRender, setIsShadowRender] = useState(true)

  const { isRender, setIsRender } = useIsEffectRender(isOpen, durantionDown)

  const onLayout = (e: any) => {
    if (listHeight === -1) {
      console.debug(e.nativeEvent.layout.height)
      setListHeight(e.nativeEvent.layout.height)

      setTimeout(() => {
        setIsShadowRender(false)
        setIsRender(false)
      }, 500)
    }
  }

  const animatedStyle = useAnimatedStyle(() => {
    const heightValue = isOpen ? listHeight : 0
    const opacityValue = isOpen ? 1 : 0

    return {
      height: withTiming(heightValue, {
        duration: durantionDown,
        easing: Easing.linear
      }),
      opacity: withTiming(opacityValue, {
        duration: durantionOpacity,
        easing: Easing.linear
      })
    }
  }, [isOpen])

  return {
    animatedStyle: isShadowRender ? styles.hide : animatedStyle,
    onLayout,
    isRender: isShadowRender || isRender
  }
}

const styles = StyleSheet.create({
  hide: {
    opacity: 0,
    position: 'absolute',
    zIndex: -1
  }
})
