// @flow

import * as React from 'react'
import { StyleSheet, Text as RNText, View } from 'react-native'

import styles from './styles'

export type TextProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Text extends React.Component<TextProps> {
  render() {
    const { children, style, ...props } = this.props

    return (
      <RNText
        ellipsizeMode="middle"
        numberOfLines={1}
        style={[styles.text, style]}
        {...props}
      >
        {children}
      </RNText>
    )
  }
}

export type RowProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Row extends React.Component<RowProps> {
  render() {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.row, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type ItemProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Item extends React.Component<ItemProps> {
  render() {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.item, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type Props = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Recipient extends React.Component<Props> {
  static Item = Item
  static Row = Row
  static Text = Text

  render() {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.recipient, style]} {...props}>
        {children}
      </View>
    )
  }
}

export default Recipient
