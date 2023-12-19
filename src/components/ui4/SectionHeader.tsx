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
          <TouchableOpacity onPress={onRightPress}>
            <EdgeText style={styles.tappableText}>{rightText}</EdgeText>
          </TouchableOpacity>
        )
      }}
    </SplitRowsView>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerText: {
    marginLeft: theme.rem(1)
  },
  tappableText: {
    color: theme.iconTappable,
    marginRight: theme.rem(1),
    textAlign: 'right'
  }
}))
