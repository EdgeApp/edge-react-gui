import * as React from 'react'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  title: string
}

export const SceneHeaderUi4 = (props: Props) => {
  const { title } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>{title == null ? null : <EdgeText style={styles.title}>{title}</EdgeText>}</View>
      <LinearGradient colors={theme.dividerLineColors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.underline} />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    marginHorizontal: theme.rem(0.5),
    paddingBottom: theme.rem(1),
    overflow: 'visible'
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: theme.rem(1.2),
    fontFamily: theme.fontFaceMedium
  },
  underline: {
    height: theme.dividerLineHeight,
    alignSelf: 'stretch',
    marginTop: theme.rem(1),
    marginRight: theme.rem(-1)
  }
}))
