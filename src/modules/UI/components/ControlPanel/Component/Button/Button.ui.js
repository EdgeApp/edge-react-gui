// @flow

import * as React from 'react'
import { StyleSheet, Text as RNText, TouchableHighlight, View } from 'react-native'

import { rawStyles, styles } from './styles.js'

export type TextProps = {
  children: React.Node,
  style?: StyleSheet.style
}
export class Text extends React.Component<TextProps> {
  render() {
    const { children, style, ...props } = this.props

    return (
      <RNText style={[styles.text, style]} {...props}>
        {children}
      </RNText>
    )
  }
}

export type RowProps = {
  children: React.Node,
  style?: StyleSheet.style
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
  style?: StyleSheet.style
}
export class Item extends React.Component<ItemProps> {
  render() {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.row, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type LeftProps = {
  children: React.Node,
  style?: StyleSheet.style
}
export class Left extends React.Component<LeftProps> {
  render() {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.left, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type CenterProps = {
  children: React.Node,
  style?: StyleSheet.style
}
export class Center extends React.Component<CenterProps> {
  render() {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.center, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type RightProps = {
  children: React.Node,
  style?: StyleSheet.style
}
export class Right extends React.Component<RightProps> {
  render() {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.right, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type ButtonProps = {
  children: React.Node,
  onPress: Function,
  underlayColor?: string,
  style?: StyleSheet.style
}
export class Button extends React.Component<ButtonProps> {
  static Row = Row
  static Item = Item
  static Left = Left
  static Center = Center
  static Right = Right
  static Text = Text

  render() {
    const { children, style, onPress, underlayColor = rawStyles.underlay.color, ...props } = this.props

    return (
      <TouchableHighlight underlayColor={underlayColor} onPress={onPress}>
        <View style={[styles.button, style]} {...props}>
          {children}
        </View>
      </TouchableHighlight>
    )
  }
}
