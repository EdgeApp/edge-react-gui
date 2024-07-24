import * as React from 'react'
import { Image, View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

export function PairIcons({ icons }: { icons: string[] }) {
  const styles = getStyles(useTheme())
  return (
    <View style={styles.container}>
      {icons.map((icon, index) => (
        <Image style={[styles.icon, index > 0 ? styles.consecutiveIcon : undefined]} source={{ uri: icon }} key={icon} />
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
