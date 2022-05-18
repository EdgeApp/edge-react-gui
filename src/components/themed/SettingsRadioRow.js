// @flow

import * as React from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { memo } from '../../types/reactHooks.js'
import { useTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type Props = {
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

/**
 * A settings row with a radio selector on the right side.
 */
const SettingsRadioRowComponent = (props: Props): React.Node => {
  const { children, disabled = false, label, value, onPress } = props
  const theme = useTheme()

  const style = {
    color: disabled ? theme.iconDeactivated : theme.iconTappable,
    fontSize: theme.rem(1.25),
    marginHorizontal: theme.rem(0.5)
  }

  const rightIcon = value ? <IonIcon name="ios-radio-button-on" style={style} /> : <IonIcon name="ios-radio-button-off" style={style} />
  return (
    <SettingsRow disabled={disabled} label={label} right={rightIcon} onPress={onPress}>
      {children}
    </SettingsRow>
  )
}

export const SettingsRadioRow = memo(SettingsRadioRowComponent)
