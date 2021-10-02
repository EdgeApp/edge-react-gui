// @flow

import * as React from 'react'
import { StatusBar } from 'react-native'

import { type ThemeProps, withTheme } from './ThemeContext.js'

function StatusBarManagerComponent(props: ThemeProps) {
  const { theme } = props
  return <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
}

export const StatusBarManager = withTheme(StatusBarManagerComponent)
