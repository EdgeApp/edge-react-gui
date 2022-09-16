import * as React from 'react'
import { ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { ThemeProps, withTheme } from '../../../../components/services/ThemeContext'

const UPPER_LEFT = { x: 0, y: 0 }
const UPPER_RIGHT = { x: 1, y: 0 }

type OwnProps = {
  children?: React.ReactNode
  style?: ViewStyle
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
