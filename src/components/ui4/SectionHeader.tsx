import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SplitRowsView } from './SplitRowsView'

interface Props {
  leftText: string
  rightText?: string
  onRightPress?: () => void
}

/**
 * A view representing rows of data split on the left and right edges of the
 * line. Neither side will exceed 50% of the width of the view.
 **/
export const SectionHeader = (props: Props) => {
  const { leftText, rightText, onRightPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <SplitRowsView>
      {{
        left: <EdgeText style={styles.headerText}>{leftText}</EdgeText>,
        right: (
          <TouchableOpacity onPress={onRightPress} style={styles.rightTappableContainer}>
            <EdgeText style={styles.tappableText}>{rightText}</EdgeText>
          </TouchableOpacity>
        )
      }}
    </SplitRowsView>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  rightTappableContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: theme.rem(0.5)
  },
  headerText: {
    marginTop: theme.rem(0.5),
    marginLeft: theme.rem(1)
  },
  tappableText: {
    color: theme.iconTappable,
    fontSize: theme.rem(0.75),
    marginRight: theme.rem(1),
    textAlign: 'right'
  }
}))
