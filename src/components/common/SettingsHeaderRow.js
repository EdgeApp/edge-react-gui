// @flow

import React, { type Node } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { nightText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz'

type Props = {
  icon?: Node,
  text: string
}

/**
 * A blue header row in a settings scene.
 */
export function SettingsHeaderRow (props: Props) {
  const { icon, text } = props

  return (
    <Gradient style={styles.row}>
      {icon != null ? <View style={styles.padding}>{icon}</View> : undefined}
      <Text style={styles.text}>{text}</Text>
    </Gradient>
  )
}

const rawStyles = {
  row: {
    // Layout:
    minHeight: THEME.rem(3),
    paddingLeft: THEME.rem(0.5),
    paddingRight: THEME.rem(0.5),

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },

  text: {
    ...nightText('row-left'),
    flexGrow: 1,
    fontSize: THEME.rem(1.125),
    padding: THEME.rem(0.5)
  },

  padding: {
    padding: THEME.rem(0.5)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
