// @flow

import * as React from 'react'
import { Text, View } from 'react-native'

import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type Props = {
  icon?: React.Node,

  // Insert a text node after the other children when set:
  label?: string
}

/**
 * A blue header row in a settings scene.
 */
export const SettingsHeaderRowComponent = (props: Props): React.Node => {
  const { icon, label } = props
  const styles = getStyles(useTheme())

  return (
    <View style={styles.row}>
      {icon != null ? <View style={styles.padding}>{icon}</View> : undefined}
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    // Layout:
    minHeight: theme.rem(2.75),
    padding: theme.rem(1),
    backgroundColor: theme.settingsRowHeaderBackground,

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
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

export const SettingsHeaderRow = memo(SettingsHeaderRowComponent)
