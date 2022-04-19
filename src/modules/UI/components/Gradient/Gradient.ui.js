// @flow

import * as React from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { type ThemeProps, withTheme } from '../../../../components/services/ThemeContext.js'

const UPPER_LEFT = { x: 0, y: 0 }
const UPPER_RIGHT = { x: 1, y: 0 }

type OwnProps = {
  children?: React.Node,
  style?: StyleSheet.Styles
}
type Props = OwnProps & ThemeProps

class GradientComponent extends React.PureComponent<Props> {
  render() {
    const { children, theme, style } = this.props
    return (
      <LinearGradient style={style} start={UPPER_LEFT} end={UPPER_RIGHT} colors={theme.backgroundGradientColors}>
        {children}
      </LinearGradient>
    )
  }
}

export const Gradient = withTheme(GradientComponent)
