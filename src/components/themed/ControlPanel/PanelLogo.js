// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import edgeLogo from '../../../assets/images/edgeLogo/Edge_logo_S.png'
import { type Theme, cacheStyles, useTheme } from '../../../components/services/ThemeContext'

export function PanelLogo() {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.logo}>
      <Image style={styles.logoImage} source={edgeLogo} resizeMode="contain" />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  logo: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.rem(2),
    marginLeft: theme.rem(0.8)
  },
  logoImage: {
    height: theme.rem(2.5),
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(0.25)
  }
}))
