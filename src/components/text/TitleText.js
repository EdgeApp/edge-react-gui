// @flow

import * as React from 'react'
import { Platform, StyleSheet, Text } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type Props = {|
  children?: React.Node,
  style?: StyleSheet.Styles
|}

export function TitleText(props: Props) {
  const { children, style, ...otherProps } = props
  const theme = useTheme()
  const { text, androidAdjust } = getStyles(theme)

  return (
    <Text
      style={[text, style, Platform.OS === 'android' ? androidAdjust : null]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.65}
      {...otherProps}
    >
      {children}
    </Text>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  text: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },
  androidAdjust: {
    top: -1
  }
}))
