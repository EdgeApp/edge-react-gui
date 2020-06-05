// @flow

import React, { type Node } from 'react'
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'

import { dayText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'

type Props = {
  disabled?: boolean, // Show with grey style
  icon?: Node,
  text: string | Node,
  right?: Node,
  onPress?: () => void
}

/**
 * A settings row features tappable text, as well as an optional icon
 * on the left and another optional component on the right.
 */
export function SettingsRow(props: Props): Node {
  const { disabled = false, icon, text, right, onPress } = props

  return (
    <TouchableHighlight onPress={onPress} underlayColor={THEME.COLORS.TRANSPARENT}>
      <View style={styles.row}>
        {icon != null ? <View style={styles.padding}>{icon}</View> : undefined}
        <Text style={disabled ? styles.disabledText : styles.text}>{text}</Text>
        {right != null ? <View style={styles.padding}>{right}</View> : undefined}
      </View>
    </TouchableHighlight>
  )
}

const commonText = {
  ...dayText('row-left'),
  color: THEME.COLORS.GRAY_1,
  flexGrow: 1,
  padding: THEME.rem(0.5)
}

const rawStyles = {
  row: {
    // Appearance:
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: THEME.rem(1 / 16),

    // Layout:
    minHeight: THEME.rem(3.25),
    paddingLeft: THEME.rem(0.5),
    paddingRight: THEME.rem(0.5),

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },

  text: commonText,
  disabledText: { ...commonText, color: THEME.COLORS.GRAY_2 },

  padding: {
    padding: THEME.rem(0.5)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
