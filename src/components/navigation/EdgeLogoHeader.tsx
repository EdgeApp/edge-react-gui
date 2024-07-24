import * as React from 'react'
import { Image } from 'react-native'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

export function EdgeLogoHeader() {
  const theme = useTheme()
  const styles = getStyles(theme)
  return <Image accessibilityHint={lstrings.app_logo_hint} resizeMode="contain" source={theme.headerIcon} style={styles.icon} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    width: theme.rem(6),
    height: theme.rem(2)
  }
}))
