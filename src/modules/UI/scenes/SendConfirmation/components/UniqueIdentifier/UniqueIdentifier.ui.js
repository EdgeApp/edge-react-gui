// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { Text as RNText, StyleSheet, View } from 'react-native'

import styles from './styles.js'

export type TextProps = {
  children: Node,
  style?: StyleSheet.Style
}
export class Text extends Component<TextProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <RNText ellipsizeMode={'middle'} numberOfLines={1} style={[styles.text, style]} {...props}>
        {children}
      </RNText>
    )
  }
}

export type Props = {
  children: Node,
  style?: StyleSheet.Styles
}
export class UniqueIdentifier extends Component<Props> {
  static Text = Text

  render () {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.uniqueIdentifier, style]} {...props}>
        {children}
      </View>
    )
  }
}
export default UniqueIdentifier
