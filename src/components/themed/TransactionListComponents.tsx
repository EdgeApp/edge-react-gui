import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export const EmptyLoader = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.emptyLoader}>
      <ActivityIndicator color={theme.icon} size="large" />
    </View>
  )
}

export const SectionHeader = (props: { title?: string }) => {
  const styles = getStyles(useTheme())
  return (
    <View style={styles.headerContainer}>
      <EdgeText style={styles.headerDate}>{props.title || ''}</EdgeText>
    </View>
  )
}

export const SectionHeaderCentered = (props: { title?: string; loading: boolean }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.headerLoaderContainer}>
      {props.loading ? <ActivityIndicator color={theme.icon} size="large" /> : <EdgeText style={styles.headerLoaderText}>{props.title || ''}</EdgeText>}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  emptyLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(10)
  },
  headerContainer: {
    backgroundColor: theme.listSectionHeaderBackground,
    paddingLeft: theme.rem(1),
    paddingVertical: theme.rem(0.5)
  },
  headerDate: {
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceMedium
  },
  headerLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(28)
  },
  headerLoaderText: {
    fontSize: theme.rem(1.25),
    fontFamily: theme.fontFaceMedium
  }
}))
