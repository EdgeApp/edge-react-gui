import * as React from 'react'
import { View } from 'react-native'

import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'

type Props = {
  icon: React.ReactNode
  leftText: string
  leftTextExtended?: string | React.ReactNode
  leftSubtext: string
  rightText?: string | React.ReactNode
  rightSubText?: string | React.ReactNode
  rightSubTextExtended?: React.ReactNode
  marginRem?: number[] | number
}

// -----------------------------------------------------------------------------
// A view representing fields of data accompanied by a left-justified icon
// -----------------------------------------------------------------------------
const IconDataRowComponent = (props: Props) => {
  const { icon, leftText, leftSubtext, leftTextExtended, rightText, rightSubText, rightSubTextExtended, marginRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))

  return (
    <View style={[styles.container, margin]}>
      {icon}
      <View style={styles.leftColumn}>
        <View style={styles.row}>
          <EdgeText style={styles.leftText}>{leftText}</EdgeText>
          {leftTextExtended != null ? <EdgeText style={styles.leftTextExtended}>{leftTextExtended}</EdgeText> : null}
        </View>
        <EdgeText style={styles.leftSubtext}>{leftSubtext}</EdgeText>
      </View>
      <View style={styles.rightColumn}>
        {rightText != null ? <EdgeText>{rightText}</EdgeText> : null}
        <View style={styles.row}>
          {rightSubText != null ? <EdgeText style={styles.rightSubText}>{rightSubText}</EdgeText> : null}
          {rightSubTextExtended}
        </View>
      </View>
    </View>
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
