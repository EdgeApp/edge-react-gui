import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { lstrings } from '../../locales/strings'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {}

export function CryptoExchangeQuoteProcessingScene(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <View style={styles.container}>
        <EdgeText style={styles.title}>{lstrings.hang_tight}</EdgeText>
        <EdgeText style={styles.findingText} numberOfLines={2}>
          {lstrings.trying_to_find}
        </EdgeText>
        <ActivityIndicator style={styles.spinner} color={theme.iconTappable} />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    marginTop: theme.rem(3)
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(1.25),
    marginBottom: theme.rem(1.25)
  },
  findingText: {
    maxWidth: theme.rem(10),
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(0.75)
  }
}))
