import * as React from 'react'
import { Platform, Text, TextStyle } from 'react-native'

import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'

interface OwnProps {
  children: React.ReactNode
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip'
  numberOfLines?: number
  style?: TextStyle
  disableFontScaling?: boolean
  minimumFontScale?: number
}

// @ts-expect-error
export class EdgeTextComponent extends React.PureComponent<OwnProps & ThemeProps & Text.props> {
  render() {
    const { children, style, theme, disableFontScaling = false, ...props } = this.props
    const { text, androidAdjust } = getStyles(theme)
    let numberOfLines = this.props.numberOfLines || 1
    if (typeof children === 'string' && children.includes('\n')) {
      numberOfLines = numberOfLines + (children.match(/\n/g) || []).length
    }

    return (
      <Text
        style={[text, style, Platform.OS === 'android' ? androidAdjust : null]}
        numberOfLines={numberOfLines}
        adjustsFontSizeToFit={!disableFontScaling}
        minimumFontScale={0.65}
        {...props}
      >
        {children}
      </Text>
    )
  }
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

export const EdgeText = withTheme(EdgeTextComponent)
