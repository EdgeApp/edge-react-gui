// @flow

import * as React from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'
import { useEffect, useState } from '../../../../../util/hooks'

type Props = {
  isDisable: boolean
}

export default function PanelDisable(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { isDisable } = props

  const [isRender, setIsRender] = useState(isDisable)

  const opacity = useSharedValue(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isDisable) {
      setIsRender(isDisable)
      opacity.value = 0.8
    } else {
      opacity.value = 0
      setTimeout(() => {
        setIsRender(isDisable)
      }, 500)
    }
  })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, {
        duration: 500,
        easing: Easing.linear
      })
    }
  })

  return isRender ? <Animated.View style={[styles.disable, animatedStyle]} /> : null
}

const getStyles = cacheStyles((theme: Theme) => ({
  disable: {
    backgroundColor: '#87939E',
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
}))
