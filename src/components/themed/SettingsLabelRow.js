// @flow
import { wrap } from 'cavy'
import * as React from 'react'
import { Text } from 'react-native'

import { memo } from '../../types/reactHooks.js'
import { useTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type Props = {
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

/**
 * A settings row with a smaller text on the right side.
 */
export const SettingsLabelRowComponent = (props: Props): React.Node => {
  const { children, disabled, label, right, onPress } = props
  const theme = useTheme()
  const style = {
    color: disabled ? theme.deactivatedText : theme.textLink,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    marginHorizontal: theme.rem(0.5)
  }

  const rightText = <Text style={style}>{right}</Text>
  return (
    <SettingsRow disabled={disabled} label={label} right={rightText} onPress={onPress}>
      {children}
    </SettingsRow>
  )
}

export const SettingsLabelRow = wrap(memo(SettingsLabelRowComponent))
