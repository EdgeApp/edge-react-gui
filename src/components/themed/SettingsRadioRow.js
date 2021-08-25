// @flow

import * as React from 'react'

import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'
import { RadioIcon } from './ThemedButtons.js'

type OwnProps = {
  children?: React.Node,

  // Show with a dim style when set. Defaults to false:
  disabled?: boolean,

  // Insert a text label after the other children when set:
  label?: string,

  // Whether the radio component is selected or not:
  value: boolean,

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

type Props = OwnProps & ThemeProps

/**
 * A settings row with a radio selector on the right side.
 */
function SettingsRadioRowComponent(props: Props): React.Node {
  const { children, disabled = false, label, value, onPress } = props

  return (
    <SettingsRow disabled={disabled} label={label} right={<RadioIcon value={value} />} onPress={onPress}>
      {children}
    </SettingsRow>
  )
}

export const SettingsRadioRow: React.StatelessFunctionalComponent<$Exact<OwnProps>> = withTheme(SettingsRadioRowComponent)
