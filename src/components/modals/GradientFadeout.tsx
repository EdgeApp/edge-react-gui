import * as React from 'react'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { cacheStyles } from 'react-native-patina'

import { Theme, useTheme } from '../services/ThemeContext'

const MARKS: number[] = [0, 0.2, 0.75, 1]
const START = { x: 0, y: 0 }
const END = { x: 0, y: 1 }

/*
 * Used for adding a gradient fadeout to the bottom of a list modal
 */
export function GradientFadeOut() {
  const theme = useTheme()
  const styles = getStyles(theme)
  const color = theme.modal
  const colors: string[] = MARKS.map(mark => color + `0${Math.floor(255 * mark).toString(16)}`.slice(-2))

  return (
    <View>
      <LinearGradient style={styles.container} start={START} end={END} colors={colors} locations={MARKS} pointerEvents="none" />
    </View>
  )
}
const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    position: 'absolute',
    height: theme.rem(1.5),
    width: '100%',
    bottom: 0
  }
}))
