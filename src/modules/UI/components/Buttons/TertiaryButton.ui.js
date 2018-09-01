// @flow

import React, { Component } from 'react'
import type { Node } from 'react-native'
import { Text as RNText, StyleSheet, TouchableHighlight, View } from 'react-native'

import { rawStyles, styles } from './style.js'

export type TextProps = {
  children: Node,
  style?: StyleSheet.Styles
}
class Text extends Component<TextProps> {
  render () {
    const { children, style, ...props } = this.props
    return (
      <RNText numberOfLines={1} ellipsizeMode={'middle'} style={[styles.buttonText, styles.tertiaryButtonText, style]} {...props}>
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
export class TertiaryButton extends Component<Props> {
  static Text = Text
  render () {
    const { children, style, ...props } = this.props
    return (
      <TouchableHighlight underlayColor={rawStyles.tertiaryButtonUnderlay.color} style={[styles.button, styles.tertiaryButton, style]} {...props}>
        <View>{children}</View>
      </TouchableHighlight>
    )
  }
}
