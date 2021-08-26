// @flow

import * as React from 'react'
import { Switch, View } from 'react-native'

import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type OwnProps = {
  children?: React.Node,

  // Show with a dim style when set. Defaults to false:
  disabled?: boolean,

  // Insert a text label after the other children when set:
  text?: string,

  // Whether the switch component is active or not:
  value: boolean,

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

type Props = OwnProps & ThemeProps

/**
 * A settings row with a switch component on the right side.
 */
function SettingsSwitchRowComponent(props: Props): React.Node {
  const { children, disabled, text, theme, value, onPress } = props

  const right = (
    <View pointerEvents="none">
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
    <SettingsRow disabled={disabled} text={text} right={right} onPress={onPress}>
      {children}
    </SettingsRow>
  )
}

export const SettingsSwitchRow: React.StatelessFunctionalComponent<$Exact<OwnProps>> = withTheme(SettingsSwitchRowComponent)
