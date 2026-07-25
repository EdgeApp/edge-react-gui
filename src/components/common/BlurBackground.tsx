import React from 'react'
import { Platform, StyleSheet } from 'react-native'
import { BlurView } from 'rn-id-blurview'

import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'

const isAndroid = Platform.OS === 'android'

// Android below 12 (API 31) blurs via RenderScript, which cannot snapshot
// content rendered by the new architecture: instead of the content behind it,
// the blur paints a flat gray wash that washes out whatever it covers. There
// is no way to make it render correctly on those devices, so skip it entirely
// and let hosts paint a solid background instead (see getBlurFallbackStyle).
export const isBlurDisabled = isAndroid && Number(Platform.Version) < 31

/**
 * Solid background for containers whose BlurBackground cannot render (see
 * isBlurDisabled). Spread into a style object: it contributes nothing at all
 * on capable devices, leaving their styles untouched.
 */
export const getBlurFallbackStyle = (
  theme: Theme
): { backgroundColor: string } | null =>
  isBlurDisabled
    ? { backgroundColor: theme.isDark ? '#161616' : '#f6f6f6' }
    : null

/** A blur background WITH rounded corners, used for most components */
export const BlurBackground: React.FC = () => {
  const theme = useTheme()
  const styles = getStyles(theme)

  if (isBlurDisabled) return null
  return (
    <BlurView
      blurType={theme.isDark ? 'dark' : 'light'}
      style={[styles.blurView, styles.roundCorner]}
      overlayColor="rgba(0, 0, 0, 0)"
    />
  )
}

/** A blur background WITHOUT rounded corners. For the scene header/footer */
export const BlurBackgroundNoRoundedCorners: React.FC = () => {
  const theme = useTheme()
  const styles = getStyles(theme)

  if (isBlurDisabled) return null
  return (
    <BlurView
      blurType={theme.isDark ? 'dark' : 'light'}
      style={styles.blurView}
      overlayColor="rgba(0, 0, 0, 0)"
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  blurView: {
    ...StyleSheet.absoluteFill,
    // We need this backgroundColor because Android applies an overlay to the
    // entire screen for the BlurView by default. We change this default
    // behavior with the transparent overlayColor, so we add this background
    // color to compensate and to match iOS colors/shades.
    backgroundColor: isAndroid
      ? theme.isDark
        ? '#161616aa'
        : '#ffffff55'
      : undefined
  },
  roundCorner: {
    // Weird quirk: iOS needs rounding at this component level to properly round
    // corners, even if the parent has round corners. Parents can't hide
    // overflows for this component.
    // Android behaves as expected when a parent with rounded corners holds
    // `BlurBackground,` properly hiding overflows.
    borderRadius: theme.cardBorderRadius
  }
}))
