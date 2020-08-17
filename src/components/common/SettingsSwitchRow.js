// @flow

import * as React from 'react'
import { Switch } from 'react-native'

import { type ThemeProps, withTheme } from '../../theme/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type OwnProps = {
  disabled?: boolean,
  icon?: React.Node,
  text: string,
  value: boolean,
  onPress: () => void
}

type Props = OwnProps & ThemeProps

/**
 * A settings row with a switch component on the right side.
 */
function SettingsSwitchRowComponent(props: Props): React.Node {
  const { disabled = false, icon, text, theme, value, onPress } = props
  const { toggleButton, toggleButtonOff } = theme
  const trackColor = {
    false: toggleButtonOff,
    true: toggleButton
  }
  const iosBackgroundColor = toggleButtonOff

  const right = <Switch disabled={disabled} onChange={onPress} value={value} ios_backgroundColor={iosBackgroundColor} trackColor={trackColor} />
  return <SettingsRow disabled={disabled} icon={icon} text={text} right={right} onPress={onPress} />
}

export const SettingsSwitchRow = withTheme(SettingsSwitchRowComponent)
