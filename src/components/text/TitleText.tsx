import * as React from 'react'
import { Platform, type TextStyle } from 'react-native'

import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { UnscaledText } from './UnscaledText'

interface Props {
  children?: React.ReactNode
  style?: TextStyle
}

export function TitleText(props: Props) {
  const { children, style, ...otherProps } = props
  const theme = useTheme()
  const { text, androidAdjust } = getStyles(theme)

  return (
    <UnscaledText
      style={[text, style, Platform.OS === 'android' ? androidAdjust : null]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.65}
      {...otherProps}
    >
      {children}
    </UnscaledText>
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
