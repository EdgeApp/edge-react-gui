// @flow

import type { Node } from 'react'
import React, { Component } from 'react'
import { StyleSheet, Text as RNText, TouchableHighlight, View } from 'react-native'

import styles, { rawStyles } from './styles.js'

export type TextProps = {
  children: Node,
  style?: StyleSheet.style
}
export class Text extends Component<TextProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <RNText style={[styles.text, style]} {...props}>
        {children}
      </RNText>
    )
  }
}

export type RowProps = {
  children: Node,
  style?: StyleSheet.style
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
  style?: StyleSheet.style
}
export class Item extends Component<ItemProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.row, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type LeftProps = {
  children: Node,
  style?: StyleSheet.style
}
export class Left extends Component<LeftProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.left, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type CenterProps = {
  children: Node,
  style?: StyleSheet.style
}
export class Center extends Component<CenterProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.center, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type RightProps = {
  children: Node,
  style?: StyleSheet.style
}
export class Right extends Component<RightProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.right, style]} {...props}>
        {children}
      </View>
    )
  }
}

export type ButtonProps = {
  children: Node,
  onPress: Function,
  underlayColor?: string,
  style?: StyleSheet.style
}
export class Button extends Component<ButtonProps> {
  static Row = Row
  static Item = Item
  static Left = Left
  static Center = Center
  static Right = Right
  static Text = Text

  render () {
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
