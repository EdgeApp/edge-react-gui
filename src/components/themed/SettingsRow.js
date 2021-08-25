// @flow

import * as React from 'react'
import { ActivityIndicator, Text, TouchableHighlight, View } from 'react-native'

import { usePendingPress } from '../../hooks/usePendingPress.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  children?: React.Node,

  // Show with a dim style when set. Defaults to false:
  disabled?: boolean,

  // Insert a text label after the other children when set:
  label?: string,

  // An interactive control to render on the right:
  right?: React.Node,

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

type Props = OwnProps & ThemeProps

/**
 * A settings row places an interactive control next to a description,
 * which can be some combination of React children and a plain text label.
 */
function SettingsRowComponent(props: Props): React.Node {
  const { children, disabled = false, label, theme, right, onPress } = props
  const styles = getStyles(theme)

  const [pending, handlePress] = usePendingPress(onPress)

  const textStyle = {
    marginLeft: children == null ? 0 : theme.rem(0.75),
    marginRight: right == null && !pending ? 0 : theme.rem(0.75)
  }

  return (
    <TouchableHighlight onPress={handlePress} underlayColor={theme.settingsRowPressed}>
      <View style={styles.row}>
        {children}
        {label == null ? null : <Text style={[disabled ? styles.disabledText : styles.text, textStyle]}>{label}</Text>}
        {pending ? <ActivityIndicator color={theme.iconTappable} style={styles.spinner} /> : right}
      </View>
    </TouchableHighlight>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    // Appearance:
    backgroundColor: theme.settingsRowBackground,

    // Layout:
    marginBottom: theme.rem(1 / 16),
    minHeight: theme.rem(2.75),
    padding: theme.rem(1),

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  text: {
    color: theme.primaryText,
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    textAlign: 'left'
  },
  disabledText: {
    color: theme.deactivatedText,
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    textAlign: 'left'
  },
  spinner: {
    paddingLeft: theme.rem(0.75)
  }
}))

export const SettingsRow: React.ComponentType<$Exact<OwnProps>> = withTheme(SettingsRowComponent)
