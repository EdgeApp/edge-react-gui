import * as React from 'react'
import { Image, View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { Tile } from './Tile'

type Props = {
  children: React.ReactNode
  iconUri: string
  iconOverride?: React.ReactNode
  title: string
}

export const IconTile = (props: Props) => {
  const { children, iconUri, iconOverride, title } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const icon = iconOverride === undefined ? <Image style={styles.icon} source={{ uri: iconUri }} /> : iconOverride

  return (
    <Tile type="static" title={title} contentPadding={false}>
      <View style={styles.tileContainer}>
        {icon}
        {children}
      </View>
    </Tile>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    marginRight: theme.rem(0.5),
    resizeMode: 'contain'
  },
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.rem(0.5)
  }
}))
