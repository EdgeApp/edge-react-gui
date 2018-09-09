// @flow

import React, { Component } from 'react'
import type { Node } from 'react-native'
import { default as RN, TouchableHighlight, View } from 'react-native'

import { rawStyles, styles } from '../../Buttons/style.js'

export type TertiaryButtonProps = {
  onPress: Function,
  children: Node,
  style?: Object
}
export type TertiaryButtonState = {}
export class TertiaryButton extends Component<TertiaryButtonProps, TertiaryButtonState> {
  static Text: Node
  render () {
    return (
      <TouchableHighlight
        onPress={this.props.onPress}
        underlayColor={rawStyles.tertiaryButtonUnderlay.color}
        style={[styles.button, styles.tertiaryButton, this.props.style]}
      >
        <View>{this.props.children}</View>
      </TouchableHighlight>
    )
  }
}

export type TertiaryButtonTextProps = {
  children: Node,
  style?: Object
}
export type TertiaryButtonTextState = {}

TertiaryButton.Text = class Text extends Component<TertiaryButtonTextProps, TertiaryButtonTextState> {
  render () {
    return <RN.Text style={[styles.buttonText, styles.tertiaryButtonText, this.props.style]}>{this.props.children}</RN.Text>
  }
}
