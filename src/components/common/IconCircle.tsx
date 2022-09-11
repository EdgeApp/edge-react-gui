import * as React from 'react'
import { StyleSheet, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

type Props = {
  // @ts-expect-error
  children: React.ChildrenArray<React.ReactNode>
}

export const iconSize = THEME.rem(3.5)

/**
 * Place this inside a modal (before the content box) to get an
 * offset circle for holding an icon.
 */
export function IconCircle(props: Props) {
  // @ts-expect-error
  return <View style={styles.iconCircle}>{props.children}</View>
}

const rawStyles = {
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
}

// @ts-expect-error
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
