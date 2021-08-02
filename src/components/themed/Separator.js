// @flow
import * as React from 'react'
import { StyleSheet, View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'

export type Props = {
  style?: StyleSheet.Styles
}

export default function Separator(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  return <View style={[styles.separator, props.style]} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  separator: {
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  }
}))
