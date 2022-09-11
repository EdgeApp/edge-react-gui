import * as React from 'react'
import { StyleSheet, Text as RNText, TouchableHighlight, View } from 'react-native'

import { rawStyles, styles } from './style'

export type TextProps = {
  children: React.ReactNode
  style?: StyleSheet
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
  children: React.ReactNode
  style?: StyleSheet
  onPress?: () => unknown
}
export class TertiaryButton extends React.Component<Props> {
  static Text = Text
  render() {
    const { children, style, ...props } = this.props
    return (
      <TouchableHighlight underlayColor={rawStyles.tertiaryButtonUnderlay.color} style={[styles.button, styles.tertiaryButton, style]} {...props}>
        <View>{children}</View>
      </TouchableHighlight>
    )
  }
}
