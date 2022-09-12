import * as React from 'react'
import { StyleSheet, Text as RNText, TouchableHighlight, View } from 'react-native'

import { rawStyles, styles } from './style'

export type TextProps = {
  children: React.ReactNode
  // @ts-expect-error
  style?: StyleSheet.Styles
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

export type Props = {
  children: React.ReactNode
  // @ts-expect-error
  style?: StyleSheet.Styles
  onPress?: () => unknown
}
export class PrimaryButton extends React.Component<Props> {
  static Text = Text
  render() {
    const { children, style, ...props } = this.props
    return (
      <TouchableHighlight underlayColor={rawStyles.primaryButtonUnderlay.color} style={[styles.button, styles.primaryButton, style]} {...props}>
        <View>{children}</View>
      </TouchableHighlight>
    )
  }
}
