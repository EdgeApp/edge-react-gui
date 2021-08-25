// @flow

import * as React from 'react'
import { Text } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type OwnProps = {
  children?: React.Node,

  // Show with a dim style when set. Defaults to false:
  disabled?: boolean,

  // Insert a text label after the other children when set:
  label?: string,

  // An interactive text label to render on the right:
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
  const { children, disabled, label, right, theme, onPress } = props
  const styles = getStyles(theme)

  const rightText = <Text style={styles.labelText}>{right}</Text>
  return (
    <SettingsRow disabled={disabled} label={label} right={rightText} onPress={onPress}>
      {children}
    </SettingsRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  labelText: {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    color: theme.textLink
  }
}))

export const SettingsLabelRow: React.StatelessFunctionalComponent<$Exact<OwnProps>> = withTheme(SettingsLabelRowComponent)
