import React from 'react'
import { Platform, StyleSheet } from 'react-native'
import { BlurView } from 'rn-id-blurview'

import { cacheStyles, useTheme } from '../services/ThemeContext'

const isAndroid = Platform.OS === 'android'

export interface BlurBackgroundProps {
  overlayColor?: string
}

export const BlurBackground = (props: BlurBackgroundProps) => {
  const { overlayColor = 'rgba(0, 0, 0, 0)' } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return <BlurView blurType={theme.isDark ? 'dark' : 'light'} style={styles.blurView} overlayColor={overlayColor} />
}

const getStyles = cacheStyles(() => ({
  blurView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isAndroid ? '#00000055' : undefined
  }
}))
