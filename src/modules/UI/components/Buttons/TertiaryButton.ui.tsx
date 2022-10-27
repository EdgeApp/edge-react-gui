import * as React from 'react'
import { Text as RNText, TextStyle, TouchableHighlight, View } from 'react-native'

import { styles, tertiaryButtonUnderlay } from './style'

export interface TextProps {
  children: React.ReactNode
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

export interface Props {
  children: React.ReactNode
  style?: TextStyle
  onPress?: () => unknown
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
