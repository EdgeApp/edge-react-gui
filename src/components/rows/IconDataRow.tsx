import * as React from 'react'
import { View } from 'react-native'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  icon: React.ReactNode
  leftText: string
  leftTextExtended?: React.ReactNode
  leftSubtext: string | React.ReactNode
  rightText?: string | React.ReactNode
  rightSubText?: string | React.ReactNode
  rightSubTextExtended?: React.ReactNode
  marginRem?: number[] | number
}

// -----------------------------------------------------------------------------
// A view representing fields of data accompanied by a left-justified icon
// -----------------------------------------------------------------------------
const IconDataRowComponent: React.FC<Props> = (props: Props) => {
  const {
    icon,
    leftText,
    leftSubtext,
    leftTextExtended,
    rightText,
    rightSubText,
    rightSubTextExtended,
    marginRem
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))

  return (
    <View style={[styles.container, margin]}>
      {icon}
      <View style={styles.leftColumn}>
        <View style={styles.row}>
          {typeof leftText === 'string' ? (
            <EdgeText accessible style={styles.leftText}>
              {leftText}
            </EdgeText>
          ) : (
            leftText
          )}
          {leftTextExtended}
        </View>
        {typeof leftSubtext === 'string' ? (
          <EdgeText accessible style={styles.leftSubtext}>
            {leftSubtext}
          </EdgeText>
        ) : (
          leftSubtext
        )}
      </View>
      <View style={styles.rightColumn}>
        {rightText == null ? null : typeof rightText === 'string' ? (
          <EdgeText>{rightText}</EdgeText>
        ) : (
          rightText
        )}
        <View accessible style={styles.row}>
          {rightSubText == null ? null : typeof rightSubText === 'string' ? (
            <EdgeText style={styles.rightSubText}>{rightSubText}</EdgeText>
          ) : (
            rightSubText
          )}
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
    flexDirection: 'column'
  },
  leftColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.25),
    marginLeft: theme.rem(0.5)
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
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
    fontFamily: theme.fontFaceMedium
  },
  leftSubtext: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const IconDataRow = React.memo(IconDataRowComponent)
