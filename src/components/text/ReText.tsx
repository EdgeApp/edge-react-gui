import React, { memo } from 'react'
import {
  Platform,
  TextInput,
  type TextProps as RNTextProps
} from 'react-native'
import { cacheStyles } from 'react-native-patina'
import Animated, { useAnimatedProps } from 'react-native-reanimated'

import type { Theme } from '../../types/Theme'
import { type ThemeProps, withTheme } from '../services/ThemeContext'

interface TextProps {
  text: Animated.SharedValue<string>
  style?: Animated.AnimateProps<RNTextProps>['style']
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const ReTextComponent: React.FC<TextProps & ThemeProps> = props => {
  const { theme, text, style } = props

  const { baseStyle, androidAdjust } = getStyles(theme)

  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value
      // Here we use any because the text prop is not available in the type
    } as any
  })

  const memoizedStyle = React.useMemo(
    () => [
      [baseStyle, Platform.OS === 'android' ? androidAdjust : null],
      style
    ],
    [androidAdjust, baseStyle, style]
  )

  return (
    <AnimatedTextInput
      allowFontScaling={false}
      underlineColorAndroid="transparent"
      editable={false}
      value={text.value}
      style={memoizedStyle}
      {...{ animatedProps }}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  baseStyle: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },
  androidAdjust: {
    top: -1,
    marginBottom: -14,
    marginTop: -10
  }
}))

export const ReText = memo(withTheme(ReTextComponent))
