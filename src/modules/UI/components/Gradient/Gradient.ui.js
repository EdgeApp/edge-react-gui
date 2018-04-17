// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import THEME from '../../../../theme/variables/airbitz'

const REVERSE_COLORS = [THEME.COLORS.GRADIENT.DARK, THEME.COLORS.GRADIENT.LIGHT]
const COLORS = [THEME.COLORS.GRADIENT.LIGHT, THEME.COLORS.GRADIENT.DARK]
const UPPER_LEFT = { x: 0, y: 0 }
const UPPER_RIGHT = { x: 1, y: 0 }

export type Props = {
  children?: Node,
  reverse?: boolean,
  style?: StyleSheet.Styles
}

export class Gradient extends Component<Props> {
  render () {
    const { reverse, style } = this.props
    return (
      <LinearGradient style={style} start={UPPER_LEFT} end={UPPER_RIGHT} colors={reverse ? REVERSE_COLORS : COLORS}>
        {this.props.children}
      </LinearGradient>
    )
  }
}

export default Gradient
