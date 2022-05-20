// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

export function EdgeLogoHeader() {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.container}>
      <Image style={styles.icon} source={theme.headerIcon} resizeMode="contain" />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    width: theme.rem(7),
    height: theme.rem(2),
    marginBottom: theme.rem(0.1875)
  }
}))
