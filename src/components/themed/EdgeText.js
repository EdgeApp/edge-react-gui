// @flow

import * as React from 'react'
import { StyleSheet, Text } from 'react-native'

import {
  type Theme,
  type ThemeProps,
  cacheStyles,
  withTheme
} from '../services/ThemeContext.js'

type OwnProps = {
  children: React.Node,
  ellipsizeMode?: string,
  numberOfLines?: number,
  style?: StyleSheet.Styles
}

class EdgeTextComponent extends React.PureComponent<OwnProps & ThemeProps> {
  render() {
    const { children, style, theme, ...props } = this.props
    const { text } = getStyles(theme)
    let numberOfLines = this.props.numberOfLines || 1
    if (typeof children === 'string' && children.includes('\n')) {
      numberOfLines = numberOfLines + (children.match(/\n/g) || []).length
    }
    return (
      <Text
        style={[text, style]}
        numberOfLines={numberOfLines}
        allowFontScaling
        adjustsFontSizeToFit
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
    fontSize: theme.rem(1)
  }
}))

export const EdgeText = withTheme(EdgeTextComponent)
