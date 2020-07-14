// @flow

import React, { type Node } from 'react'
import { Switch } from 'react-native'

import { type ThemeProps, withTheme } from '../../theme/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type OwnProps = {
  disabled?: boolean,
  icon?: Node,
  text: string,
  value: boolean,
  onPress: () => void
}

type Props = OwnProps & ThemeProps

/**
 * A settings row with a switch component on the right side.
 */
function SettingsSwitchRowComponent(props: Props): Node {
  const { disabled = false, icon, text, theme, value, onPress } = props
  const { settingsSwitchEnabledBackground, settingsSwitchDisabledBackground } = theme
  const trackColor = {
    false: settingsSwitchDisabledBackground,
    true: settingsSwitchEnabledBackground
  }
  const ios_backgroundColor = settingsSwitchDisabledBackground

  const right = <Switch disabled={disabled} onChange={onPress} value={value} ios_backgroundColor={ios_backgroundColor} trackColor={trackColor} />
  return <SettingsRow disabled={disabled} icon={icon} text={text} right={right} onPress={onPress} />
}

export const SettingsSwitchRow = withTheme(SettingsSwitchRowComponent)
