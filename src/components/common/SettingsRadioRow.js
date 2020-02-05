// @flow

import type { Node } from 'react'
import React from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { THEME } from '../../theme/variables/airbitz.js'
import { SettingsRow } from './SettingsRow.js'

type Props = {
  disabled?: boolean,
  icon?: Node,
  text: string,
  isSelected: boolean,
  onPress: () => void
}

/**
 * A settings row with a radio selector on the right side.
 */
export function SettingsRadioRow (props: Props): Node {
  const { disabled, icon, text, isSelected, onPress } = props

  const radio = isSelected ? (
    <IonIcon size={THEME.rem(1.414)} color={THEME.COLORS.SECONDARY} name="ios-radio-button-on" />
  ) : (
    <IonIcon size={THEME.rem(1.414)} color={THEME.COLORS.GRAY_1} name="ios-radio-button-off" />
  )

  return <SettingsRow disabled={disabled} icon={icon} text={text} right={radio} onPress={onPress} />
}
