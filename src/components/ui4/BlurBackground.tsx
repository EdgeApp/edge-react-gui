import React from 'react'
import { Platform, StyleSheet } from 'react-native'
import { BlurView } from 'rn-id-blurview'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

const isAndroid = Platform.OS === 'android'

export const BlurBackground = () => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return <BlurView blurType={theme.isDark ? 'dark' : 'light'} style={styles.blurView} overlayColor="rgba(0, 0, 0, 0)" />
}

const getStyles = cacheStyles((theme: Theme) => ({
  blurView: {
    ...StyleSheet.absoluteFillObject,
    // We need this backgroundColor because Android applies an overlay to the
    // entire screen for the BlurView by default. We change this default
    // behavior with the transparent overlayColor, so we add this background
    // color to compensate and to match iOS colors/shades.
    backgroundColor: isAndroid ? (theme.isDark ? '#161616aa' : '#ffffff55') : undefined
  }
}))
