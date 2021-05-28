// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

export function WalletListSectionHeader(props: { title: string }) {
  const styles = getStyles(useTheme())
  return (
    <View style={styles.container}>
      <EdgeText style={styles.text}>{props.title}</EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    backgroundColor: theme.modal
  },
  text: {
    fontSize: theme.rem(0.75)
  }
}))
