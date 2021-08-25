// @flow

import * as React from 'react'

import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'
import { RadioIcon } from './ThemedButtons.js'

type OwnProps = {
  disabled?: boolean,
  icon?: React.Node,
  text: string,
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
  const { disabled = false, icon, text, value, onPress } = props

  return <SettingsRow disabled={disabled} icon={icon} text={text} right={<RadioIcon value={value} />} onPress={onPress} />
}

export const SettingsRadioRow: React.StatelessFunctionalComponent<$Exact<OwnProps>> = withTheme(SettingsRadioRowComponent)
