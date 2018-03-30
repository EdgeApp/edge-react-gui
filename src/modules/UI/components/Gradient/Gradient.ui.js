// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import THEME from '../../../../theme/variables/airbitz'

export type Props = {
  children?: Node,
  reverse?: boolean,
  style?: StyleSheet.Styles
}
type State = {}
export default class Gradient extends Component<Props, State> {
  render () {
    const UPPER_LEFT = { x: 0, y: 0 }
    const UPPER_RIGHT = { x: 1, y: 0 }
    const colors = this.props.reverse ? [THEME.COLORS.GRADIENT.DARK, THEME.COLORS.GRADIENT.LIGHT] : [THEME.COLORS.GRADIENT.LIGHT, THEME.COLORS.GRADIENT.DARK]
    return (
      <LinearGradient style={this.props.style} start={UPPER_LEFT} end={UPPER_RIGHT} colors={colors}>
        {this.props.children}
      </LinearGradient>
    )
  }
}
