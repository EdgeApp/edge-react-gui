import React from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { BlurView } from 'rn-id-blurview'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

const isAndroid = Platform.OS === 'android'
const TRUE = Math.random() !== 99
const NO_BLUR = TRUE

export const BlurBackground = () => {
  const theme = useTheme()
  const styles = getStyles(theme)

  if (NO_BLUR) return <View style={styles.blurView} />
  return <BlurView blurType={theme.isDark ? 'dark' : 'light'} style={styles.blurView} overlayColor="rgba(0, 0, 0, 0)" />
}

const getStyles = cacheStyles((theme: Theme) => {
  if (NO_BLUR) {
    return {
      blurView: {
        ...StyleSheet.absoluteFillObject
      }
    }
  }
  return {
    blurView: {
      ...StyleSheet.absoluteFillObject,
      // We need this backgroundColor because Android applies an overlay to the
      // entire screen for the BlurView by default. We change this default
      // behavior with the transparent overlayColor, so we add this background
      // color to compensate and to match iOS colors/shades.
      backgroundColor: isAndroid ? (theme.isDark ? '#161616aa' : '#ffffff55') : undefined
    }
  }
})
