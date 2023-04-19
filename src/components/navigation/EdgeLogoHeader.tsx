import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

export function EdgeLogoHeader() {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.container}>
      <FastImage style={styles.icon} source={theme.headerIcon} resizeMode="contain" accessibilityHint={lstrings.app_logo_hint} />
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
