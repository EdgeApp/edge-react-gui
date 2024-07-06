import * as React from 'react'
import { cacheStyles } from 'react-native-patina'

import { SplitRowsView } from '../layout/SplitRowsView'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeTouchableOpacity } from './EdgeTouchableOpacity'

interface Props {
  leftTitle: string
  rightNode?: string | React.ReactNode

  /** @deprecated Only to be used during the UI4 transition */
  marginRem?: number[] | number

  onRightPress?: () => void
}

/**
 * A view representing rows of data split on the left and right edges of the
 * line.
 *
 * If the right side is a string and onRightPress handler is provided, it will
 * be rendered as green tappable text, else it's up to the caller to decide.
 **/
export const SectionHeader = (props: Props) => {
  const { leftTitle, rightNode, marginRem = [0.5, 1, 0, 1], onRightPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <SplitRowsView marginRem={marginRem}>
      {{
        left: <EdgeText>{leftTitle}</EdgeText>,
        right:
          typeof rightNode === 'string' && onRightPress != null ? (
            <EdgeTouchableOpacity onPress={onRightPress} style={styles.rightTappableContainer}>
              <EdgeText style={styles.tappableText}>{rightNode}</EdgeText>
            </EdgeTouchableOpacity>
          ) : (
            rightNode
          )
      }}
    </SplitRowsView>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
