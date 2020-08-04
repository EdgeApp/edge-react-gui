// @flow

import React, { type Node } from 'react'
import { Text } from 'react-native'

import { dayText } from '../../styles/common/textStyles.js'
import { type ThemeProps, cacheStyles, withTheme } from '../../theme/ThemeContext.js'
import { SettingsRow } from './SettingsRow.js'

type OwnProps = {
  disabled?: boolean,
  icon?: Node,
  text: string,
  right: string,
  onPress: () => void
}

type Props = OwnProps & ThemeProps

/**
 * A settings row with a smaller text on the right side.
 */
export function SettingsLabelRowComponent(props: Props): Node {
  const { disabled, icon, text, theme, right, onPress } = props
  const styles = getStyles(theme)

  return <SettingsRow disabled={disabled} icon={icon} text={text} right={<Text style={styles.labelText}>{right}</Text>} onPress={onPress} />
}

const getStyles = cacheStyles(theme => ({
  labelText: {
    ...dayText('bold', 'small'),
    fontSize: theme.rem(1),
    color: theme.textLink
  }
}))

export const SettingsLabelRow = withTheme(SettingsLabelRowComponent)
