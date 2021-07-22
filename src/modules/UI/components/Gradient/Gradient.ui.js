// @flow

import * as React from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { type ThemeProps, withTheme } from '../../../../components/services/ThemeContext.js'

const UPPER_LEFT = { x: 0, y: 0 }
const UPPER_RIGHT = { x: 1, y: 0 }

type OwnProps = {
  children?: React.Node,
  reverse?: boolean,
  style?: StyleSheet.Styles
}
type Props = OwnProps & ThemeProps

class GradientComponent extends React.PureComponent<Props> {
  render() {
    const { children, reverse, theme, style } = this.props
    const colors = [theme.backgroundGradientLeft, theme.backgroundGradientRight]
    const reverseColors = [theme.backgroundGradientRight, theme.backgroundGradientLeft]
    return (
      <LinearGradient style={style} start={UPPER_LEFT} end={UPPER_RIGHT} colors={reverse ? reverseColors : colors}>
        {children}
      </LinearGradient>
    )
  }
}

export const Gradient = withTheme(GradientComponent)
export default Gradient
