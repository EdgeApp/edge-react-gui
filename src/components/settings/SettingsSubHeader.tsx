import * as React from 'react'
import { View } from 'react-native'

import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'

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
      <UnscaledText style={styles.instructionText}>{label}</UnscaledText>
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
