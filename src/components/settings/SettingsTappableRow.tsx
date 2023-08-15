import * as React from 'react'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { useTheme } from '../services/ThemeContext'
import { SettingsRow } from './SettingsRow'

interface Props {
  // The icon to show on the right.
  // Defaults to navigate, which shows an arrow.
  action?: 'navigate' | 'add' | 'delete' | 'lock' | 'unlock'

  children?: React.ReactNode

  // Show with a dim style when set. Defaults to false:
  disabled?: boolean

  // Show with red text when set. Defaults to false:
  dangerous?: boolean

  // Insert a text label after the other children when set:
  label?: string

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

/**
 * A settings row with an icon on the right side.
 * The default icon is a navigation arrow, but other options are available.
 */
const SettingsTappableRowComponent = (props: Props) => {
  const { action = 'navigate', children, disabled, dangerous, label, onPress } = props
  const theme = useTheme()
  const style = {
    color: disabled ? theme.iconDeactivated : theme.iconTappable,
    fontSize: theme.rem(1),
    marginHorizontal: theme.rem(0.5)
  }

  const rightIcon =
    action === 'navigate' ? (
      <FontAwesome5 name="chevron-right" style={style} />
    ) : action === 'add' ? (
      <AntDesignIcon name="plus" style={style} />
    ) : action === 'delete' ? (
      <AntDesignIcon name="close" style={style} />
    ) : (
      <AntDesignIcon name={action} style={style} />
    )
  return (
    <SettingsRow disabled={disabled} dangerous={dangerous} label={label} right={rightIcon} onPress={onPress}>
      {children}
    </SettingsRow>
  )
}

export const SettingsTappableRow = React.memo(SettingsTappableRowComponent)
