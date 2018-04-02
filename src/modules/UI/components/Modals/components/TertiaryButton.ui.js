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
      <RN.Text style={[styles.buttonText, styles.tertiaryButtonText, this.props.style]}>
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
export class TertiaryButton extends Component<Props> {
  static Text = Text
  render () {
    return (
      <TouchableHighlight
        underlayColor={rawStyles.tertiaryButtonUnderlay.color}
        {...this.props}
        style={[styles.button, styles.tertiaryButton, this.props.style]}
      >
        <View>
          {this.props.children}
        </View>
      </TouchableHighlight>
    )
  }
}
