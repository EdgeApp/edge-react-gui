import * as React from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

import {
  ENTER_ANIMATION,
  RIGHT_BALANCE_ENTER_ANIMATION,
  RIGHT_BALANCE_EXIT_ANIMATION,
  RIGHT_BALANCE_LAYOUT_ANIMATION,
  WALLET_ENTER_ANIMATION
} from '../../../constants/animationConstants'
import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'

interface Props {
  icon: React.ReactNode
  leftText: string
  leftTextExtended?: string | React.ReactNode
  leftSubtext: string | React.ReactNode
  rightText?: string | React.ReactNode
  rightSubText?: string | React.ReactNode
  rightSubTextExtended?: React.ReactNode
  marginRem?: number[] | number
}

let keyNum = 0
// -----------------------------------------------------------------------------
// A view representing fields of data accompanied by a left-justified icon
// -----------------------------------------------------------------------------
const IconDataRowComponent = (props: Props) => {
  const { icon, leftText, leftSubtext, leftTextExtended, rightText, rightSubText, rightSubTextExtended, marginRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))
  const hideRight = rightText == null && rightSubText == null && rightSubTextExtended == null
  keyNum++
  if (keyNum > 10) keyNum = 0

  return (
    <Animated.View style={[styles.container, margin]} entering={WALLET_ENTER_ANIMATION(keyNum * 20)}>
      {icon}
      <View style={styles.leftColumn}>
        <View style={styles.row}>
          <EdgeText style={styles.leftText}>{leftText}</EdgeText>
          {leftTextExtended != null ? <EdgeText style={styles.leftTextExtended}>{leftTextExtended}</EdgeText> : null}
        </View>
        <EdgeText style={styles.leftSubtext}>{leftSubtext}</EdgeText>
      </View>
      {!hideRight ? (
        <Animated.View
          key={keyNum.toString()}
          style={styles.rightColumn}
          layout={RIGHT_BALANCE_LAYOUT_ANIMATION}
          entering={RIGHT_BALANCE_ENTER_ANIMATION(keyNum * 10)}
          exiting={RIGHT_BALANCE_EXIT_ANIMATION(keyNum * 10)}
        >
          {rightText != null ? <EdgeText>{rightText}</EdgeText> : null}
          <View style={styles.row}>
            {rightSubText != null ? <EdgeText style={styles.rightSubText}>{rightSubText}</EdgeText> : null}
            {rightSubTextExtended}
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Layout:
  rightColumn: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    paddingRight: theme.rem(1)
  },
  leftColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.5),
    marginLeft: theme.rem(1)
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: theme.rem(0.5)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },

  // Text:
  rightSubText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  leftText: {
    flexBasis: 'auto',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium
  },
  leftTextExtended: {
    textAlign: 'left',
    flexBasis: 'auto',
    flexShrink: 1,
    marginLeft: theme.rem(0.75)
  },
  leftSubtext: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const IconDataRow = React.memo(IconDataRowComponent)
