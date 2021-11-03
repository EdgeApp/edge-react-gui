// @flow

import * as React from 'react'
import { Text, View } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  icon?: React.Node,

  // Insert a text node after the other children when set:
  label?: string
}

type Props = OwnProps & ThemeProps

/**
 * A blue header row in a settings scene.
 */
export function SettingsHeaderRowComponent(props: Props): React.Node {
  const { icon, label, theme } = props
  const styles = getStyles(theme)

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
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    textAlign: 'left',
    color: theme.primaryText
  },

  padding: {
    paddingRight: theme.rem(0.75)
  }
}))

export const SettingsHeaderRow: React.StatelessFunctionalComponent<$Exact<OwnProps>> = withTheme(SettingsHeaderRowComponent)
