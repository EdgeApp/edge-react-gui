import { useMemo } from 'react'
import type { FlexAlignType, ViewStyle } from 'react-native'

import { DEFAULT_MARGIN_REM } from '../components/common/Margins'
import { useTheme } from '../components/services/ThemeContext'

export interface LayoutStyleProps {
  /** Sets the alignment of the element within its container */
  alignSelf?: FlexAlignType

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

export type LayoutStyle = Pick<
  ViewStyle,
  'alignSelf' | 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight'
>

export const useLayoutStyle = (props: LayoutStyleProps): LayoutStyle => {
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

  const topUnits = topRem ?? verticalRem ?? aroundRem ?? DEFAULT_MARGIN_REM
  const bottomUnits =
    bottomRem ?? verticalRem ?? aroundRem ?? DEFAULT_MARGIN_REM
  const leftUnits = leftRem ?? horizontalRem ?? aroundRem ?? DEFAULT_MARGIN_REM
  const rightUnits =
    rightRem ?? horizontalRem ?? aroundRem ?? DEFAULT_MARGIN_REM

  // Margins:
  const marginTop = theme.rem(topUnits)
  const marginBottom = theme.rem(bottomUnits)
  const marginLeft = theme.rem(leftUnits)
  const marginRight = theme.rem(rightUnits)

  const style: LayoutStyle = useMemo(() => {
    const style: LayoutStyle = {
      marginTop,
      marginBottom,
      marginLeft,
      marginRight
    }
    // Low impact way of adding this prop to the collection (avoids huge snapshot diff)
    if (alignSelf != null) {
      style.alignSelf = alignSelf
    }
    return style
  }, [alignSelf, marginBottom, marginLeft, marginRight, marginTop])

  return style
}
