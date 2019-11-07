// @flow

import React, { Component } from 'react'
import type { Node } from 'react-native'
import { StyleSheet, Text as RNText, TouchableHighlight, View } from 'react-native'

import { rawStyles, styles } from './style.js'

export type TextProps = {
  children: Node,
  style?: StyleSheet.Styles
}
class Text extends Component<TextProps> {
  render () {
    const { children, style, ...props } = this.props
    return (
      <RNText numberOfLines={1} ellipsizeMode={'middle'} style={[styles.buttonText, styles.primaryButtonText, style]} {...props}>
        {children}
      </RNText>
    )
  }
}

export type Props = {
  children: Node,
  style?: StyleSheet.Styles,
  onPress: () => void
}
export class PrimaryButton extends Component<Props> {
  static Text = Text
  render () {
    const { children, style, ...props } = this.props
    return (
      <TouchableHighlight underlayColor={rawStyles.primaryButtonUnderlay.color} style={[styles.button, styles.primaryButton, style]} {...props}>
        <View>{children}</View>
      </TouchableHighlight>
    )
  }
}
