// @flow

import type { Node } from 'react'
import React, { Component } from 'react'
import { StyleSheet, Text as RNText, View } from 'react-native'

import styles from './styles'

export type TextProps = {
  children: Node,
  style?: StyleSheet.Styles
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

export type RowProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Row extends Component<RowProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.row, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type ItemProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Item extends Component<ItemProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.item, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type Props = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Recipient extends Component<Props> {
  static Item = Item
  static Row = Row
  static Text = Text

  render () {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.recipient, style]} {...props}>
        {children}
      </View>
    )
  }
}

export default Recipient
