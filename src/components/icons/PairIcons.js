// @flow

import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

export function PairIcons({ icons }: { icons: string[] }): React.Node {
  const styles = getStyles(useTheme())
  return (
    <View style={styles.container}>
      {icons.map((icon, index) => (
        <FastImage style={[styles.icon, index > 0 ? styles.consecutiveIcon : undefined]} source={{ uri: icon }} key={index} />
      ))}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.rem(0.5)
  },
  icon: {
    width: theme.rem(3),
    height: theme.rem(3)
  },
  consecutiveIcon: {
    marginLeft: theme.rem(-0.5)
  }
}))
