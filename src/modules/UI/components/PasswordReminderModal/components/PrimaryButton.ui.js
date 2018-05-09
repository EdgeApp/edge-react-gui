// @flow

import React, { Component } from 'react'
import type { Node } from 'react-native'
import RN, { TouchableHighlight } from 'react-native'

import styles, { styles as styleRaw } from './styles.js'

export type Props = {
  onPress: Function,
  children: Node,
  style?: Object
}
export type State = {}
export class PrimaryButton extends Component<Props, State> {
  static Text: Node
  render () {
    return (
      <TouchableHighlight
        onPress={this.props.onPress}
        underlayColor={styleRaw.primaryButtonUnderlay.color}
        style={[styles.primaryButton, this.props.style]}
      >
        {this.props.children}
      </TouchableHighlight>
    )
  }
}

export type PrimaryButtonTextProps = {
  children: Node,
  style?: Object
}
export type PrimaryButtonTextState = {}

PrimaryButton.Text = class Text extends Component<PrimaryButtonTextProps, PrimaryButtonTextState> {
  render () {
    return <RN.Text style={[styles.buttonText, styles.primaryButtonText, this.props.style]}>{this.props.children}</RN.Text>
  }
}
