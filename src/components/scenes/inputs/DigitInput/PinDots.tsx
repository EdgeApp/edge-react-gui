/**
 * IMPORTANT: Changes in this file MUST be synced between edge-react-gui and
 * edge-login-ui-rn!
 */
import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { Theme, useTheme } from '../../../services/ThemeContext'

interface Props {
  pinLength: number
  maxLength: number
}

export function PinDots({ maxLength, pinLength }: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {[...new Array(maxLength)].map((_, index) => (
        <View key={index} style={[styles.circle, pinLength > index && styles.circleFilled]} />
      ))}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  circle: {
    borderWidth: theme.mediumLineWidth,
    borderColor: theme.primaryText,
    borderRadius: theme.rem(1),
    height: theme.rem(2),
    width: theme.rem(2)
  },
  circleFilled: {
    backgroundColor: theme.iconTappable
  }
}))
