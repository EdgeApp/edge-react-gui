// @flow

import * as React from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
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
 * A settings row with a radio selector on the right side.
 */
function SettingsRadioRowComponent(props: Props): React.Node {
  const { disabled = false, icon, text, value, onPress, theme } = props

  const right = value ? (
    <IonIcon size={theme.rem(1.25)} color={theme.iconTappable} name="ios-radio-button-on" />
  ) : (
    <IonIcon size={theme.rem(1.25)} color={theme.icon} name="ios-radio-button-off" />
  )
  return <SettingsRow disabled={disabled} icon={icon} text={text} right={right} onPress={onPress} />
}

export const SettingsRadioRow = withTheme(SettingsRadioRowComponent)
