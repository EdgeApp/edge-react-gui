// @flow

import * as React from 'react'
import { Text, View } from 'react-native'

import { type ThemeProps, cacheStyles, withTheme } from '../../theme/ThemeContext.js'

type OwnProps = {
  icon?: React.Node,
  text: string
}

type Props = OwnProps & ThemeProps

/**
 * A blue header row in a settings scene.
 */
export function SettingsHeaderRowComponent(props: Props): React.Node {
  const { icon, text, theme } = props
  const styles = getStyles(theme)

  return (
    <View style={styles.row}>
      {icon != null ? <View style={styles.padding}>{icon}</View> : undefined}
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const getStyles = cacheStyles(theme => ({
  row: {
    // Layout:
    minHeight: theme.rem(2.75),
    padding: theme.rem(0.75),
    backgroundColor: theme.settingsRowHeaderBackground,

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },

  text: {
    flexShrink: 1,
    flexGrow: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    textAlign: 'left',
    color: theme.primaryText
  },

  padding: {
    paddingRight: theme.rem(0.75)
  }
}))

export const SettingsHeaderRow = withTheme(SettingsHeaderRowComponent)
