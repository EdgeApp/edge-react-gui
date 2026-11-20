import * as React from 'react'
import { StatusBar } from 'react-native'

import { type ThemeProps, withTheme } from './ThemeContext'

const StatusBarManagerComponent: React.FC<ThemeProps> = props => {
  const { theme } = props
  return (
    <StatusBar
      barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      translucent
      backgroundColor="transparent"
    />
  )
}

export const StatusBarManager = withTheme(StatusBarManagerComponent)
