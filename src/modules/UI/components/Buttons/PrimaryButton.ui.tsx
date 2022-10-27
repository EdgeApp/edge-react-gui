import * as React from 'react'
import { Text as RNText, TextStyle, TouchableHighlight, TouchableHighlightProps, View } from 'react-native'

import { primaryButtonUnderlay, styles } from './style'

interface TextProps {
  children: React.ReactNode
  style?: TextStyle
}
class Text extends React.Component<TextProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <RNText numberOfLines={1} ellipsizeMode="middle" style={[styles.buttonText, styles.primaryButtonText, style]} {...props}>
        {children}
      </RNText>
    )
  }
}

interface Props extends TouchableHighlightProps {
  children: React.ReactNode
  style?: TextStyle
  onPress?: () => unknown
}

export class PrimaryButton extends React.Component<Props> {
  static Text = Text
  render() {
    const { children, style, ...props } = this.props
    return (
      <TouchableHighlight underlayColor={primaryButtonUnderlay.color} style={[styles.button, styles.primaryButton, style]} {...props}>
        <View>{children}</View>
      </TouchableHighlight>
    )
  }
}
