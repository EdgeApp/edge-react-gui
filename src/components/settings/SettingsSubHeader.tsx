import * as React from 'react'
import { Text, View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  label: string
}

/**
 * Displays instructional text for a settings section.
 * Place this below a settings header row.
 */
export function SettingsSubHeader(props: Props) {
  const { label } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.instructionArea}>
      <Text style={styles.instructionText}>{label}</Text>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  instructionArea: {
    backgroundColor: theme.settingsRowSubHeader,
    padding: theme.rem(1)
  },
  instructionText: {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    color: theme.primaryText
  }
}))
