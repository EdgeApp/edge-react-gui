// @flow

import * as React from 'react'
import { Text } from 'react-native'

import { dayText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { SettingsRow } from './SettingsRow.js'

type Props = {
  disabled?: boolean,
  icon?: React.Node,
  text: string,
  right: string,
  onPress: () => void
}

/**
 * A settings row with a smaller text on the right side.
 */
export function SettingsLabelRow(props: Props): React.Node {
  const { disabled, icon, text, right, onPress } = props

  return <SettingsRow disabled={disabled} icon={icon} text={text} right={<Text style={styles.labelText}>{right}</Text>} onPress={onPress} />
}

const styles = {
  labelText: {
    ...dayText('bold', 'small'),
    color: THEME.COLORS.SECONDARY
  }
}
