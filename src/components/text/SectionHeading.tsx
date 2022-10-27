import * as React from 'react'
import { TextStyle } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  children: React.ReactNode
  style?: TextStyle
}

export function SectionHeading(props: Props) {
  const { children, style } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  return <EdgeText style={[styles.text, style]}>{children}</EdgeText>
}

const getStyles = cacheStyles((theme: Theme) => ({
  text: {
    color: theme.secondaryText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    includeFontPadding: false
  }
}))
