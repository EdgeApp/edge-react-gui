import * as React from 'react'
import { ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { ThemeProps, withTheme } from '../../../../components/services/ThemeContext'

interface OwnProps {
  children?: React.ReactNode
  style?: ViewStyle
}
type Props = OwnProps & ThemeProps

class GradientComponent extends React.PureComponent<Props> {
  render() {
    const { children, theme, style } = this.props
    return (
      <LinearGradient style={style} start={theme.backgroundGradientStart} end={theme.backgroundGradientEnd} colors={theme.backgroundGradientColors}>
        {children}
      </LinearGradient>
    )
  }
}

export const Gradient = withTheme(GradientComponent)
