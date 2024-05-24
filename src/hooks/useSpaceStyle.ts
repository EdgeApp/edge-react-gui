import { useMemo } from 'react'
import { ViewStyle } from 'react-native'

import { useTheme } from '../components/services/ThemeContext'

export interface SpaceProps {
  //
  // Alignment props:
  //

  // Single-sided:
  /** Align children to the top */
  alignBottom?: boolean
  /** Align children to the top */
  alignLeft?: boolean
  /** Align children to the right */
  alignRight?: boolean
  /** Align children to the top */
  alignTop?: boolean

  // Multiple-sided:
  /** Aligns children to the center */
  alignCenter?: boolean
  /** Aligns children to the center horizontally */
  alignHorizontal?: boolean
  /** Aligns children to the center vertically */
  alignVertical?: boolean

  //
  // Rem props:
  //

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

  /*
   * The `expand` space prop tells a component to expand its size within its
   * parent component. This is sometimes useful when you want to use the space
   * props to align the component.
   */
  expand?: boolean

  /*
   * The `sideways` prop is an additional, non-space props useful managing the
   * stacking direction of child components. By default, child components stack
   * vertically (column-based), from top to bottom. If `sideways={true}`, then
   * child components stack horizontally (row-based).
   * The `sideways` prop does not affect the space properties in anyway (i.e.
   * vertical is always vertical regardless of the value set for the `sideways`
   *  prop).
   */
  sideways?: boolean
}

export type SpaceStyle = Pick<
  ViewStyle,
  'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight' | 'flex' | 'flexDirection' | 'alignItems' | 'justifyContent'
>

export const useSpaceStyle = (props: SpaceProps): SpaceStyle => {
  const theme = useTheme()
  const { aroundRem, horizontalRem, verticalRem, topRem, bottomRem, leftRem, rightRem, expand = false, sideways = false } = props
  const { alignBottom, alignLeft, alignRight, alignTop, alignCenter, alignHorizontal, alignVertical } = props

  const topFill = boolify(alignBottom, alignVertical, alignCenter)
  const bottomFill = boolify(alignTop, alignVertical, alignCenter)
  const leftFill = boolify(alignRight, alignHorizontal, alignCenter)
  const rightFill = boolify(alignLeft, alignHorizontal, alignCenter)

  const topUnits = numberify(topRem, verticalRem, aroundRem)
  const bottomUnits = numberify(bottomRem, verticalRem, aroundRem)
  const leftUnits = numberify(leftRem, horizontalRem, aroundRem)
  const rightUnits = numberify(rightRem, horizontalRem, aroundRem)

  // Margins:
  const marginTop = theme.rem(topUnits)
  const marginBottom = theme.rem(bottomUnits)
  const marginLeft = theme.rem(leftUnits)
  const marginRight = theme.rem(rightUnits)

  // Direction:
  const flexDirection = sideways ? 'row' : 'column'

  // Alignment:
  const horizontalAlignment = leftFill && rightFill ? 'center' : rightFill ? 'flex-start' : leftFill ? 'flex-end' : undefined
  const verticalAlignment = topFill && bottomFill ? 'center' : bottomFill ? 'flex-start' : topFill ? 'flex-end' : undefined
  const alignItems = sideways ? verticalAlignment : horizontalAlignment
  const justifyContent = sideways ? horizontalAlignment ?? (expand ? 'space-between' : undefined) : verticalAlignment

  // Flex:
  const flex = expand ? 1 : undefined

  const style: SpaceStyle = useMemo(
    () => ({
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      flex,
      flexDirection,
      alignItems,
      justifyContent
    }),
    [alignItems, flex, flexDirection, justifyContent, marginBottom, marginLeft, marginRight, marginTop]
  )

  return style
}

const numberify = (...things: Array<number | undefined>): number => {
  for (const thing of things) {
    if (typeof thing === 'number') {
      return thing
    }
  }
  return 0
}
const boolify = (...things: Array<boolean | undefined>): boolean => {
  return things.some(thing => {
    return typeof thing === 'boolean' && thing
  })
}
