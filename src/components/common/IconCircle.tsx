import * as React from 'react'
import { StyleSheet, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

interface Props {
  children: React.ReactNode
}

export const iconSize = THEME.rem(3.5)

/**
 * Place this inside a modal (before the content box) to get an
 * offset circle for holding an icon.
 */
export function IconCircle(props: Props) {
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
    justifyContent: 'center',
    overflow: 'hidden'
  }
})
