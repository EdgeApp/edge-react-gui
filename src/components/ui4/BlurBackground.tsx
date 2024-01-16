import React from 'react'
import { StyleSheet } from 'react-native'
import { BlurView } from 'rn-id-blurview'

import { useTheme } from '../services/ThemeContext'

export interface BlurBackgroundProps {
  overlayColor?: string
}

export const BlurBackground = (props: BlurBackgroundProps) => {
  const { overlayColor = 'rgba(0, 0, 0, 0)' } = props
  const theme = useTheme()
  return <BlurView blurType={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} overlayColor={overlayColor} />
}
