// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

export function PinDots(props: { pinLength: number, maxLength: number }) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderCircle = () => {
    const circle = []
    for (let i = 0; i < props.maxLength; i++) {
      circle.push(<View key={i} style={[styles.circle, props.pinLength > i && styles.circleFilled]} />)
    }
    return circle
  }

  return <View style={styles.container}>{renderCircle()}</View>
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
