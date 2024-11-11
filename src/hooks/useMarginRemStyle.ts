import { useMemo } from 'react'
import { ViewStyle } from 'react-native'

import { useTheme } from '../components/services/ThemeContext'

export interface MarginRemProps {
  // Single-sided:
  /** Adds rem to the bottom margin side */
  bottomRem?: number
  /** Adds rem to the left margin side */
  leftRem?: number
  /** Adds rem to the right margin side */
  rightRem?: number
  /** Adds rem to the top margin side */
  topRem?: number

  // Multiple-sided:
  /** Adds rem to all margin sides */
  aroundRem?: number
  /** Adds rem to left and right margin sides */
  horizontalRem?: number
  /** Adds rem to top and bottom margin sides */
  verticalRem?: number
}

export type MarginRemStyle = Pick<ViewStyle, 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight'>

export const useMarginRemStyle = (props: MarginRemProps): MarginRemStyle => {
  const theme = useTheme()
  const { aroundRem, horizontalRem, verticalRem, topRem, bottomRem, leftRem, rightRem } = props

  const topUnits = topRem ?? verticalRem ?? aroundRem ?? 0
  const bottomUnits = bottomRem ?? verticalRem ?? aroundRem ?? 0
  const leftUnits = leftRem ?? horizontalRem ?? aroundRem ?? 0
  const rightUnits = rightRem ?? horizontalRem ?? aroundRem ?? 0

  // Margins:
  const marginTop = theme.rem(topUnits)
  const marginBottom = theme.rem(bottomUnits)
  const marginLeft = theme.rem(leftUnits)
  const marginRight = theme.rem(rightUnits)

  const style: MarginRemStyle = useMemo(
    () => ({
      marginTop,
      marginBottom,
      marginLeft,
      marginRight
    }),
    [marginBottom, marginLeft, marginRight, marginTop]
  )

  return style
}
