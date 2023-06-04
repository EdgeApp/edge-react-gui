import * as React from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { lstrings } from '../../locales/strings'
import { useTheme } from '../services/ThemeContext'
import { SettingsRow } from './SettingsRow'

interface Props {
  children?: React.ReactNode

  // Show with a dim style when set. Defaults to false:
  disabled?: boolean

  // Insert a text label after the other children when set:
  label?: string

  // Whether the radio component is selected or not:
  value: boolean

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

/**
 * A settings row with a radio selector on the right side.
 */
const SettingsRadioRowComponent = (props: Props) => {
  const { children, disabled = false, label, value, onPress } = props
  const theme = useTheme()

  const style = {
    color: disabled ? theme.iconDeactivated : theme.iconTappable,
    fontSize: theme.rem(1.25),
    marginHorizontal: theme.rem(0.5)
  }
  const accessibilityHint = `${value ? lstrings.on_hint : lstrings.off_hint} ${label}`
  const rightIcon = value ? (
    <IonIcon name="ios-radio-button-on" style={style} accessibilityRole="radio" accessibilityHint={accessibilityHint} />
  ) : (
    <IonIcon name="ios-radio-button-off" style={style} accessibilityRole="radio" accessibilityHint={accessibilityHint} />
  )
  return (
    <SettingsRow disabled={disabled} label={label} right={rightIcon} onPress={onPress}>
      {children}
    </SettingsRow>
  )
}

export const SettingsRadioRow = React.memo(SettingsRadioRowComponent)
