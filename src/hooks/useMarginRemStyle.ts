import { useMemo } from 'react'
import type { ViewStyle } from 'react-native'

import { useTheme } from '../components/services/ThemeContext'

export interface MarginRemProps {
  /** Sets the alignment of the element within its container */
  // TODO: rename this hook to not be specific to margins because we want to
  // our design system around these props
  alignSelf?: 'center' | 'flex-start' | 'flex-end' | 'stretch' | 'baseline'

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

export type MarginRemStyle = Pick<
  ViewStyle,
  'alignSelf' | 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight'
>

export const useMarginRemStyle = (
  props: MarginRemProps,
  // TODO: Remove this prop once all designs using this prop have been updated.
  /** @deprecated Your design should expect the component to have 0.5rem margins */
  defaultRem: number = 0.5
): MarginRemStyle => {
  const theme = useTheme()
  const {
    alignSelf,
    aroundRem,
    horizontalRem,
    verticalRem,
    topRem,
    bottomRem,
    leftRem,
    rightRem
  } = props

  const topUnits = topRem ?? verticalRem ?? aroundRem ?? defaultRem
  const bottomUnits = bottomRem ?? verticalRem ?? aroundRem ?? defaultRem
  const leftUnits = leftRem ?? horizontalRem ?? aroundRem ?? defaultRem
  const rightUnits = rightRem ?? horizontalRem ?? aroundRem ?? defaultRem

  // Margins:
  const marginTop = theme.rem(topUnits)
  const marginBottom = theme.rem(bottomUnits)
  const marginLeft = theme.rem(leftUnits)
  const marginRight = theme.rem(rightUnits)

  const style: MarginRemStyle = useMemo(() => {
    const style: MarginRemStyle = {
      marginTop,
      marginBottom,
      marginLeft,
      marginRight
    }
    // Low impact way of adding this prop to the collection (avoids huge snapshot diff)
    if (alignSelf != null) {
      return {
        alignSelf
      }
    }
    return style
  }, [alignSelf, marginBottom, marginLeft, marginRight, marginTop])

  return style
}
