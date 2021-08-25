// @flow

import * as React from 'react'
import { Text } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type OwnProps = {
  disabled?: boolean,
  icon?: React.Node,
  text: string,
  right: string,

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

type Props = OwnProps & ThemeProps

/**
 * A settings row with a smaller text on the right side.
 */
export function SettingsLabelRowComponent(props: Props): React.Node {
  const { disabled, icon, text, theme, right, onPress } = props
  const styles = getStyles(theme)

  return <SettingsRow disabled={disabled} icon={icon} text={text} right={<Text style={styles.labelText}>{right}</Text>} onPress={onPress} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  labelText: {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    color: theme.textLink
  }
}))

export const SettingsLabelRow: React.StatelessFunctionalComponent<$Exact<OwnProps>> = withTheme(SettingsLabelRowComponent)
