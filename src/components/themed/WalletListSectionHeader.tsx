import * as React from 'react'
import { View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export function WalletListSectionHeader(props: { title: string; rightTitle?: string }) {
  const styles = getStyles(useTheme())
  const { title, rightTitle = '' } = props
  return (
    <View style={styles.container}>
      <EdgeText style={styles.text}>{title}</EdgeText>
      <EdgeText style={styles.text}>{rightTitle}</EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    backgroundColor: theme.modal,
    paddingHorizontal: theme.rem(1),
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  text: {
    fontSize: theme.rem(0.75)
  }
}))
