// @flow

import React, { type ChildrenArray, type Node } from 'react'
import { StyleSheet, View } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz.js'

export const iconSize = scale(64)

/**
 * Place this inside a modal to get an offset circle for holding an icon.
 */
export function IconCircle (props: { children: ChildrenArray<Node> }) {
  return <View style={styles.iconCircle}>{props.children}</View>
}

const styles = StyleSheet.create({
  iconCircle: {
    // Layout:
    alignSelf: 'center',
    marginTop: -iconSize / 2,
    height: iconSize,
    width: iconSize,

    // Visuals:
    backgroundColor: THEME.COLORS.WHITE,
    borderColor: THEME.COLORS.SECONDARY,
    borderRadius: iconSize / 2,
    borderWidth: scale(4),

    // Children:
    alignItems: 'center',
    justifyContent: 'center'
  }
})
