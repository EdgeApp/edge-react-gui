// @flow

import * as React from 'react'
import { View } from 'react-native'
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'

import { cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

type Props = {
  ratio: number
}

export const Thermostat = ({ ratio }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const percent = Math.max(0, Math.min(1, ratio)) * 100
  const percentText = `${percent.toFixed(0)}%`
  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <Svg width="100%" height="12">
          <Defs>
            <LinearGradient id="gradosaur">
              <Stop offset="0.55" stopColor="#66EDA8" stopOpacity="1" />
              <Stop offset="0.90" stopColor="#E85466" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="2" width="100%" height="8" fill="url(#gradosaur)" />
          <Rect x={`${percent}%`} y="0" width="3" height="12" fill="white" rx="1" ry="1" />
        </Svg>
      </View>
      <EdgeText style={styles.percentText}>{percentText}</EdgeText>
    </View>
  )
}

const getStyles = cacheStyles(theme => {
  return {
    container: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    barContainer: {
      borderRadius: 6,
      overflow: 'hidden',
      flex: 1
    },
    percentText: {
      color: theme.warningText,
      fontSize: theme.rem(0.75),
      fontWeight: 'bold',
      marginLeft: theme.rem(0.5)
    }
  }
})
