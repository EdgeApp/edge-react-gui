import { LinearGradient } from 'expo-linear-gradient'
import * as React from 'react'
import { cacheStyles } from 'react-native-patina'

import type { GradientColors } from '../../types/Theme'
import { type Theme, useTheme } from '../services/ThemeContext'

const MARKS = [0, 0.2, 0.75, 1] as const
const START = { x: 0, y: 0 }
const END = { x: 0, y: 1 }

/*
 * Used for adding a gradient fadeout to the bottom of a list modal
 */
export const GradientFadeOut = (): React.ReactElement => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const color = theme.modal
  // Written out rather than mapped so the colors stay a fixed-length tuple:
  // `LinearGradient` wants at least two stops, and as many colors as marks.
  const colors = React.useMemo((): GradientColors => {
    const fade = (mark: number): string =>
      color + `0${Math.floor(255 * mark).toString(16)}`.slice(-2)
    const [first, second, third, fourth] = MARKS
    return [fade(first), fade(second), fade(third), fade(fourth)]
  }, [color])
  return (
    <LinearGradient
      style={styles.container}
      start={START}
      end={END}
      colors={colors}
      locations={MARKS}
      pointerEvents="none"
    />
  )
}
const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    position: 'absolute',
    height: theme.rem(3),
    width: '100%',
    bottom: 0
  }
}))
