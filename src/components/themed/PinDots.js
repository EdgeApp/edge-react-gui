// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

export function PinDots(props: { pin: string }) {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.container}>
      <View style={[styles.circle, props.pin.length > 0 && styles.circleFilled]} />
      <View style={[styles.circle, props.pin.length > 1 && styles.circleFilled]} />
      <View style={[styles.circle, props.pin.length > 2 && styles.circleFilled]} />
      <View style={[styles.circle, props.pin.length > 3 && styles.circleFilled]} />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row'
  },
  circle: {
    width: theme.rem(1),
    height: theme.rem(1),
    marginRight: theme.rem(0.5),
    borderRadius: theme.rem(0.5),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.iconTappable
  },
  circleFilled: {
    width: theme.rem(1),
    height: theme.rem(1),
    marginRight: theme.rem(0.5),
    borderRadius: theme.rem(0.5),
    borderColor: theme.iconTappable,
    backgroundColor: theme.iconTappable
  }
}))
