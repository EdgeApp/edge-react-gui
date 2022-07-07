// @flow

import * as React from 'react'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { memo } from '../../types/reactHooks.js'
import { useTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type Props = {
  // The icon to show on the right.
  // Defaults to navigate, which shows an arrow.
  action?: 'navigate' | 'add' | 'delete' | 'lock' | 'unlock',

  children?: React.Node,

  // Show with a dim style when set. Defaults to false:
  disabled?: boolean,

  // Insert a text label after the other children when set:
  label?: string,

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

/**
 * A settings row with an icon on the right side.
 * The default icon is a navigation arrow, but other options are available.
 */
const SettingsTappableRowComponent = (props: Props): React.Node => {
  const { action = 'navigate', children, disabled, label, onPress } = props
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
    <SettingsRow disabled={disabled} label={label} right={rightIcon} onPress={onPress}>
      {children}
    </SettingsRow>
  )
}

export const SettingsTappableRow = memo(SettingsTappableRowComponent)
