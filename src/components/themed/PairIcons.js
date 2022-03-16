// @flow

import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import rightArrow from '../../assets/images/rightArrow.png'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

export function PairIcons({ icons, withArrow = false }: { icons: string[], withArrow?: boolean }): React.Node {
  const styles = getStyles(useTheme())
  const lastIcon = withArrow ? icons.pop() : undefined

  return (
    <View style={styles.container}>
      {icons.map((icon, index) => (
        <FastImage style={[styles.icon, index > 0 ? styles.consecutiveIcon : undefined]} source={{ uri: icon }} key={index} />
      ))}
      {lastIcon != null ? (
        <>
          <FastImage style={styles.arrow} source={rightArrow} resizeMode="contain" />
          <FastImage style={styles.icon} source={{ uri: lastIcon }} />
        </>
      ) : null}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    width: theme.rem(3),
    height: theme.rem(3)
  },
  arrow: {
    width: theme.rem(4),
    height: theme.rem(1),
    marginHorizontal: theme.rem(0.5)
  },
  consecutiveIcon: {
    marginLeft: theme.rem(-0.5)
  }
}))
