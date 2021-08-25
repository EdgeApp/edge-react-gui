// @flow

import * as React from 'react'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type OwnProps = {
  disabled?: boolean, // Show with grey style
  icon?: React.Node,
  text: string | React.Node,

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

type Props = OwnProps & ThemeProps

/**
 * A settings row with a switch component on the right side.
 */
function SettingsTappableRowComponent(props: Props): React.Node {
  const { disabled, icon, text, theme, onPress } = props

  const rightArrow = <FontAwesome5 name="chevron-right" size={theme.rem(1)} color={theme.iconTappable} />

  return <SettingsRow disabled={disabled} icon={icon} text={text} right={rightArrow} onPress={onPress} />
}

export const SettingsTappableRow: React.StatelessFunctionalComponent<$Exact<OwnProps>> = withTheme(SettingsTappableRowComponent)
