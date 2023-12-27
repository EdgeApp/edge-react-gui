import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SplitRowsView } from './SplitRowsView'

interface Props {
  left: string | React.ReactNode
  right?: string | React.ReactNode

  /** @deprecated Only to be used during the UI4 transition */
  marginRem?: number[] | number

  onRightPress?: () => void
}

/**
 * A view representing rows of data split on the left and right edges of the
 * line. Neither side will exceed 50% of the width of the view.
 *
 * If the right side is a string and onRightPress handler is provided, it will
 * be rendered as green tappable text, else it's up to the caller to decide.
 **/
export const SectionHeaderUi4 = (props: Props) => {
  const { left, right, marginRem = [0.5, 1, 0, 1], onRightPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <SplitRowsView marginRem={marginRem}>
      {{
        left: typeof left === 'string' ? <EdgeText>{left}</EdgeText> : left,
        right:
          typeof right === 'string' && onRightPress != null ? (
            <TouchableOpacity onPress={onRightPress} style={styles.rightTappableContainer}>
              <EdgeText style={styles.tappableText}>{right}</EdgeText>
            </TouchableOpacity>
          ) : (
            right
          )
      }}
    </SplitRowsView>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  rightTappableContainer: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  tappableText: {
    color: theme.iconTappable,
    fontSize: theme.rem(0.75),
    textAlign: 'right'
  }
}))
