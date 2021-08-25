// @flow

import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import s from '../../locales/strings.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'

function CryptoExchangeQuoteProcessingScreenComponent(props: ThemeProps) {
  const styles = getStyles(props.theme)
  return (
    <SceneWrapper background="header" hasTabs={false}>
      <View style={styles.container}>
        <EdgeText style={styles.title}>{s.strings.hang_tight}</EdgeText>
        <EdgeText style={styles.findingText} numberOfLines={2}>
          {s.strings.trying_to_find}
        </EdgeText>
        <ActivityIndicator style={styles.spinner} color={props.theme.iconTappable} />
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

export const CryptoExchangeQuoteProcessingScreen = withTheme(CryptoExchangeQuoteProcessingScreenComponent)
