import * as React from 'react'
import { View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

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
    backgroundColor: theme.modal,
    paddingHorizontal: theme.rem(1)
  },
  text: {
    fontSize: theme.rem(0.75)
  }
}))
