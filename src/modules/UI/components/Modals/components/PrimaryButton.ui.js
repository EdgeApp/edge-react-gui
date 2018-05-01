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
      <RN.Text numberOfLines={1} ellipsizeMode={'middle'} {...this.props} style={[styles.buttonText, styles.primaryButtonText, this.props.style]}>
        {this.props.children}
      </RN.Text>
    )
  }
}

export type Props = {
  children: Node,
  style?: Object,
  onPress: () => void
}
export class PrimaryButton extends Component<Props> {
  static Text = Text
  render () {
    return (
      <TouchableHighlight
        underlayColor={rawStyles.primaryButtonUnderlay.color}
        numberOfLines={1}
        ellipsizeMode={'middle'}
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
