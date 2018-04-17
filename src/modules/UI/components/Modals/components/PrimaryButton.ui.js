// @flow

import React, { Component } from 'react'
import type { Node } from 'react-native'
import RN, { TouchableHighlight, View } from 'react-native'

import { styles, rawStyles } from './styles.js'

export type TextProps = {
  children: Node,
  style?: Object
}
class Text extends Component<TextProps> {
  render () {
    return (
      <RN.Text style={[styles.buttonText, styles.primaryButtonText, this.props.style]}>
        {this.props.children}
      </RN.Text>
    )
  }
}

export type Props = {
  onPress: Function,
  children: Node,
  style?: Object
}
export class PrimaryButton extends Component<Props> {
  static Text = Text
  render () {
    return (
      <TouchableHighlight
        underlayColor={rawStyles.primaryButtonUnderlay.color}
        {...this.props}
        style={[styles.button, styles.primaryButton, this.props.style]}
      >
        <View>
          {this.props.children}
        </View>
      </TouchableHighlight>
    )
  }
}
