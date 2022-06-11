// @flow

import * as React from 'react'
import { Switch, View } from 'react-native'

import { memo } from '../../types/reactHooks.js'
import { useTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type Props = {
  children?: React.Node,

  // Show with a dim style when set. Defaults to false:
  disabled?: boolean,

  // Insert a text label after the other children when set:
  label?: string,

  // Whether the switch component is active or not:
  value: boolean,

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

/**
 * A settings row with a switch component on the right side.
 */
const SettingsSwitchRowComponent = (props: Props): React.Node => {
  const { children, disabled, label, value, onPress } = props
  const theme = useTheme()

  const style = {
    marginHorizontal: theme.rem(0.5),
    padding: 0
  }

  const right = (
    <View pointerEvents="none" style={style}>
      <Switch
        disabled={disabled}
        ios_backgroundColor={theme.toggleButtonOff}
        trackColor={{
          false: theme.toggleButtonOff,
          true: theme.toggleButton
        }}
        value={value}
        onValueChange={onPress}
      />
    </View>
  )
  return (
    <SettingsRow disabled={disabled} label={label} right={right} onPress={onPress}>
      {children}
    </SettingsRow>
  )
}

export const SettingsSwitchRow = memo(SettingsSwitchRowComponent)
