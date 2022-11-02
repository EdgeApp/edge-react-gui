import * as React from 'react'
import { Text as RNText, TextStyle, TouchableHighlight, View } from 'react-native'

import { secondaryButtonUnderlay, styles } from './style'

export interface TextProps {
  children: React.ReactNode
  style?: TextStyle
}
class Text extends React.Component<TextProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <RNText numberOfLines={1} ellipsizeMode="middle" style={[styles.buttonText, styles.secondaryButtonText, style]} {...props}>
        {children}
      </RNText>
    )
  }
}

export interface Props {
  children: React.ReactNode
  style?: TextStyle
  onPress: () => void
}
export class SecondaryButton extends React.Component<Props> {
  static Text = Text
  render() {
    const { children, style, ...props } = this.props
    return (
      <TouchableHighlight underlayColor={secondaryButtonUnderlay.color} style={[styles.button, styles.secondaryButton, style]} {...props}>
        <View>{children}</View>
      </TouchableHighlight>
    )
  }
}
