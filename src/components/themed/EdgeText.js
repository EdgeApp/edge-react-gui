// @flow

import * as React from 'react'
import { Platform, StyleSheet, Text } from 'react-native'
import Reamimated from 'react-native-reanimated'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type OwnProps = {|
  children: React.Node,
  ellipsizeMode?: string,
  numberOfLines?: number,
  style?: StyleSheet.Styles,
  styles?: StyleSheet.Styles[],
  disableFontScaling?: boolean,
  animated?: boolean
|}

class EdgeTextComponent extends React.PureComponent<OwnProps & ThemeProps> {
  render() {
    const { animated, children, style, theme, disableFontScaling = false, ...props } = this.props
    const styles = this.props.styles ?? []
    const { text, androidAdjust } = getStyles(theme)
    let numberOfLines = this.props.numberOfLines || 1
    if (typeof children === 'string' && children.includes('\n')) {
      numberOfLines = numberOfLines + (children.match(/\n/g) || []).length
    }

    if (animated) {
      return (
        <Reamimated.Text
          style={[text, style, ...styles, Platform.OS === 'android' ? androidAdjust : null]}
          numberOfLines={numberOfLines}
          allowFontScaling={!disableFontScaling}
          adjustsFontSizeToFit={!disableFontScaling}
          minimumFontScale={0.65}
          {...props}
        >
          {children}
        </Reamimated.Text>
      )
    }

    return (
      <Text
        style={[text, style, ...styles, Platform.OS === 'android' ? androidAdjust : null]}
        numberOfLines={numberOfLines}
        allowFontScaling={!disableFontScaling}
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
