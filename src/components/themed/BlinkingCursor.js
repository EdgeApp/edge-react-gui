// @flow

import * as React from 'react'
import Animated from 'react-native-reanimated'

import { useBlinkAnimation } from '../../hooks/animations/useBlinkAnimation'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'

type Props = {
  // True to make the cursor visible:
  visible: boolean,

  // Font size number to make cursor with same size:
  fontSize?: number,

  // Font color to make cursor with same size:
  color?: string,

  // Animation duration, in ms:
  duration?: number
}

export const BlinkingCursor = ({ duration, visible, fontSize, color }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const animatedStyle = useBlinkAnimation(duration)

  if (!visible) return null

  return <Animated.Text style={[styles.cursor, animatedStyle, { color: color ?? theme.primaryText, fontSize: theme.rem(fontSize ?? 1) }]}>|</Animated.Text>
}

const getStyles = cacheStyles((theme: Theme) => ({
  cursor: {
    bottom: 1 // Needed for consistency between text and fake cursor
  }
}))
