// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import FastImage from 'react-native-fast-image'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler.js'
import { type Theme, cacheStyles, getTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type Props = {
  message: string,
  iconUri?: string,
  animationValue: Animated.SharedValue<number>,
  onPress: () => void,
  onClose: () => void
}

export const PromoCard = (props: Props) => {
  const { message, iconUri, onPress, onClose, animationValue } = props
  const theme = getTheme()
  const styles = getStyles(theme)

  const pressed = useSharedValue(0)

  const handlePressIn = useHandler(() => (pressed.value = 1))
  const handlePressOut = useHandler(() => (pressed.value = 0))

  const borderAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(pressed.value ? theme.promoCardBorderColorPressIn : theme.promoCardBorderColorPressOut, { duration: 100 }),
      opacity: interpolate(animationValue.value, [-1, 0, 1], [0.5, 1, 0.5])
    }
  })

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(animationValue.value, [-1, 0, 1], [0, 1, 0]), { duration: 10 })
    }
  })

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} onPress={onPress}>
      <Animated.View style={[styles.container, borderAnimatedStyle]}>
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          {iconUri != null ? <FastImage resizeMode="contain" source={{ uri: iconUri }} style={styles.icon} /> : null}

          <EdgeText numberOfLines={0} style={styles.text}>
            {message}
          </EdgeText>

          <TouchableOpacity onPress={onClose}>
            <AntDesignIcon name="close" color={theme.iconTappable} size={theme.rem(2.5)} style={styles.close} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    backgroundColor: theme.promoCardBackground,
    borderWidth: theme.promoCardBorderWidth,
    borderRadius: theme.rem(0.75),
    padding: theme.rem(1),
    height: '100%'
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    width: theme.rem(4),
    height: theme.rem(4)
  },
  text: {
    flex: 1,
    marginLeft: theme.rem(1),
    fontSize: theme.rem(3.5)
  },
  close: {}
}))
