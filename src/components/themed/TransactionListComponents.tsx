import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

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
  const theme = useTheme()
  const styles = getStyles(theme)

  if (theme.listSectionHeaderBackgroundGradientStart != null && theme.listSectionHeaderBackgroundGradientEnd != null) {
    return (
      <LinearGradient
        style={styles.headerContainer}
        start={theme.listSectionHeaderBackgroundGradientStart}
        end={theme.listSectionHeaderBackgroundGradientEnd}
        colors={theme.listSectionHeaderBackgroundGradientColors}
      >
        <EdgeText style={styles.headerDate}>{props.title || ''}</EdgeText>
      </LinearGradient>
    )
  }

  return (
    <View style={styles.headerContainer}>
      <EdgeText style={styles.headerDate}>{props.title || ''}</EdgeText>
    </View>
  )
}

export const SectionHeaderCentered = (props: { title: string }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.headerLoaderContainer}>
      <EdgeText style={styles.headerLoaderText}>{props.title}</EdgeText>
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
    backgroundColor: theme.listSectionHeaderBackgroundGradientColors[0],
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
