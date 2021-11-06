// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import edgeLogo from '../../../assets/images/edgeLogo/Edge_logo_Icon.png'
import { type Theme, cacheStyles, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import s from '../../../locales/strings'

export default function PanelLogo() {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.logo}>
      <Image style={styles.logoImage} source={edgeLogo} resizeMode="contain" />
      <EdgeText style={styles.logoText}>{s.strings.app_name_short}</EdgeText>
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
  logoText: {
    fontSize: theme.rem(2),
    fontFamily: theme.fontFaceBold,
    textTransform: 'lowercase'
  },
  logoImage: {
    width: theme.rem(1.5),
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(0.25)
  }
}))
