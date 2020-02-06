// @flow

import React, { type Node } from 'react'
import { Switch } from 'react-native'

import { SettingsRow } from './SettingsRow.js'

type Props = {
  disabled?: boolean,
  icon?: Node,
  text: string,
  value: boolean,
  onPress: () => void
}

/**
 * A settings row with a switch component on the right side.
 */
export function SettingsSwitchRow (props: Props): Node {
  const { disabled = false, icon, text, value, onPress } = props

  const right = <Switch disabled={disabled} onChange={onPress} value={value} />
  return <SettingsRow disabled={disabled} icon={icon} text={text} right={right} onPress={onPress} />
}
