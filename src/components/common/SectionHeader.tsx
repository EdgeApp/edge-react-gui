import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeTouchableOpacity } from './EdgeTouchableOpacity'

interface Props {
  leftTitle: string
  rightNode?: string | React.ReactNode

  onRightPress?: () => void
}

/**
 * A section header with a left and optional right side.
 *
 * If the right side is a string and onRightPress handler is provided, it will
 * be rendered as green tappable text, else it's up to the caller to decide.
 **/
export const SectionHeader = (props: Props) => {
  const { leftTitle, rightNode, onRightPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const right =
    typeof rightNode === 'string' ? (
      <EdgeTouchableOpacity onPress={onRightPress} style={styles.rightTappableContainer}>
        <EdgeText style={styles.tappableText}>{rightNode}</EdgeText>
      </EdgeTouchableOpacity>
    ) : (
      rightNode
    )

  return (
    <View style={styles.row}>
      <View style={styles.leftColumn}>
        <EdgeText>{leftTitle}</EdgeText>
      </View>
      <View style={styles.rightColumn}>{right}</View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  leftColumn: {
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  rightColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexGrow: 1,
    flexShrink: 1
  },
  row: {
    marginTop: theme.rem(0.5),
    marginHorizontal: theme.rem(1),
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  rightTappableContainer: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'flex-end',
    // Increase tappable area with padding, while net 0 with negative margin to visually appear as if 0 margins/padding
    padding: theme.rem(0.75),
    margin: -theme.rem(0.75)
  },
  tappableText: {
    color: theme.iconTappable,
    fontSize: theme.rem(0.75),
    textAlign: 'right'
  }
}))
