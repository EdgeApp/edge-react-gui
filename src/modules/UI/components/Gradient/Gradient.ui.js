import React, { Component } from 'react'
import LinearGradient from 'react-native-linear-gradient'

import THEME from '../../../../theme/variables/airbitz'

export default class Gradient extends Component {
  render () {
    const UPPER_LEFT = { x: 0, y: 0 }
    const UPPER_RIGHT = { x: 1, y: 0 }
    return (
      <LinearGradient style={this.props.style} start={UPPER_LEFT} end={UPPER_RIGHT} colors={[THEME.COLORS.GRADIENT.LIGHT, THEME.COLORS.GRADIENT.DARK]}>
        {this.props.children}
      </LinearGradient>
    )
  }
}
