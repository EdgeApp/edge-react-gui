import React, { memo } from 'react'
import { Platform, TextInput, TextProps as RNTextProps } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import Animated, { useAnimatedProps } from 'react-native-reanimated'

import { Theme } from '../../types/Theme'
import { ThemeProps, withTheme } from '../services/ThemeContext'

Animated.addWhitelistedNativeProps({ text: true })

interface TextProps {
  text: Animated.SharedValue<string>
  style?: Animated.AnimateProps<RNTextProps>['style']
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const ReTextComponent = (props: TextProps & ThemeProps) => {
  const { theme, text, style } = props

  const { baseStyle, androidAdjust } = getStyles(theme)

  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value
      // Here we use any because the text prop is not available in the type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  })

  const memoizedStyle = React.useMemo(() => [[baseStyle, Platform.OS === 'android' ? androidAdjust : null], style], [androidAdjust, baseStyle, style])

  return <AnimatedTextInput underlineColorAndroid="transparent" editable={false} value={text.value} style={memoizedStyle} {...{ animatedProps }} />
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
