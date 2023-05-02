import * as React from 'react'
import FastImage from 'react-native-fast-image'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

export function EdgeLogoHeader() {
  const theme = useTheme()
  const styles = getStyles(theme)
  return <FastImage accessibilityHint={lstrings.app_logo_hint} resizeMode="contain" source={theme.headerIcon} style={styles.icon} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    width: theme.rem(6),
    height: theme.rem(2)
  }
}))
