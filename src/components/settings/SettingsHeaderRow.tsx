import * as React from 'react'
import { View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  icon?: React.ReactNode

  // Insert a text node after the other children when set:
  label?: string
}

/**
 * A blue header row in a settings scene.
 * TODO: SettingsScene needs UI4 design.
 */
export const SettingsHeaderRowComponent = (props: Props) => {
  const { icon, label } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.row}>
      {icon != null ? <View style={styles.padding}>{icon}</View> : undefined}
      <EdgeText style={styles.text}>{label}</EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: theme.rem(0.5)
  },

  text: {
    flexShrink: 1,
    flexGrow: 1,
    fontFamily: theme.settingsRowHeaderFont,
    fontSize: theme.rem(theme.settingsRowHeaderFontSizeRem),
    textAlign: 'left',
    color: theme.primaryText
  },

  padding: {
    paddingRight: theme.rem(0.75)
  }
}))

export const SettingsHeaderRow = React.memo(SettingsHeaderRowComponent)
