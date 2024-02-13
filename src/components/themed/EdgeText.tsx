import * as React from 'react'
import { Platform, StyleProp, Text, TextProps, TextStyle } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props extends TextProps {
  children: React.ReactNode
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip'
  numberOfLines?: number
  style?: StyleProp<TextStyle>
  disableFontScaling?: boolean
  minimumFontScale?: number
}

export const EdgeText = (props: Props) => {
  const { children, style, disableFontScaling = false, ...rest } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  let { numberOfLines = 1 } = props
  if (typeof children === 'string' && children.includes('\n')) {
    numberOfLines = numberOfLines + (children.match(/\n/g) ?? []).length
  }

  return (
    <Text
      style={[styles.text, style, Platform.OS === 'android' ? styles.androidAdjust : null]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={!disableFontScaling}
      minimumFontScale={0.65}
      {...rest}
    >
      {children}
    </Text>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  text: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },
  androidAdjust: {
    top: -1
  }
}))
