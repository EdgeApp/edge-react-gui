// @flow

import React, { Component } from 'react'
import type { Node } from 'react-native'
import { default as RN, TouchableHighlight, View } from 'react-native'

import styles, { styles as styleRaw } from './styles.js'

export type SecondaryButtonProps = {
  onPress: Function,
  children: Node,
  style?: Object
}
export type SecondaryButtonState = {}
export class SecondaryButton extends Component<SecondaryButtonProps, SecondaryButtonState> {
  static Text: Node
  render () {
    return (
      <TouchableHighlight
        onPress={this.props.onPress}
        underlayColor={styleRaw.secondaryButtonUnderlay.color}
        style={[styles.button, styles.secondaryButton, this.props.style]}
      >
        <View>
          {this.props.children}
        </View>
      </TouchableHighlight>
    )
  }
}

export type SecondaryButtonTextProps = {
  children: Node,
  style?: Object
}
export type SecondaryButtonTextState = {}

SecondaryButton.Text = class Text extends Component<SecondaryButtonTextProps, SecondaryButtonTextState> {
  render () {
    return <RN.Text style={[styles.buttonText, styles.secondaryButtonText, this.props.style]}>{this.props.children}</RN.Text>
  }
}
