// @flow

import * as React from 'react'
import { type TextStyle, Text as RNText, TouchableHighlight, View } from 'react-native'

import { styles, tertiaryButtonUnderlay } from './style.js'

export type TextProps = {
  children: React.Node,
  style?: TextStyle
}
class Text extends React.Component<TextProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <RNText numberOfLines={1} ellipsizeMode="middle" style={[styles.buttonText, styles.tertiaryButtonText, style]} {...props}>
        {children}
      </RNText>
    )
  }
}

export type Props = {
  children: React.Node,
  style?: TextStyle,
  onPress?: () => mixed
}
export class TertiaryButton extends React.Component<Props> {
  static Text = Text
  render() {
    const { children, style, ...props } = this.props
    return (
      <TouchableHighlight underlayColor={tertiaryButtonUnderlay.color} style={[styles.button, styles.tertiaryButton, style]} {...props}>
        <View>{children}</View>
      </TouchableHighlight>
    )
  }
}
