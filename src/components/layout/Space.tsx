import * as React from 'react'
import { useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { MarginRemProps, MarginRemStyle, useMarginRemStyle } from '../../hooks/useMarginRemStyle'

export interface SpaceProps extends MarginRemProps {
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

  // Children:
  children?: React.ReactNode

  /**
   * The `expand` space prop tells a component to expand its size within its
   * parent component.
   *
   * This is particularly useful when you want to use the space props to
   * align the component.
   */
  expand?: boolean

  /**
   * Changes the orientation of child component layout from column
   * (top-to-bottom) to row (left-to-right).
   *
   * The `row` prop is an additional, non-space props useful managing the
   * stacking direction of child components. By default, child components stack
   * vertically (column-based), from top to bottom. If `row={true}`, then
   * child components stack horizontally (row-based).
   *
   * The `row` prop does not affect the alignment or rem props (i.e. vertical
   * is always vertical regardless of the value set for the `row` prop).
   */
  row?: boolean
}

type SpaceStyle = Pick<ViewStyle, 'flex' | 'flexDirection' | 'alignItems' | 'justifyContent'> & MarginRemStyle

export const Space = React.memo((props: SpaceProps) => {
  const { children } = props
  const { aroundRem, horizontalRem, verticalRem, topRem, bottomRem, leftRem, rightRem, expand = false, row = false } = props
  const { alignBottom, alignLeft, alignRight, alignTop, alignCenter, alignHorizontal, alignVertical } = props

  const topFill = boolify(alignBottom, alignVertical, alignCenter)
  const bottomFill = boolify(alignTop, alignVertical, alignCenter)
  const leftFill = boolify(alignRight, alignHorizontal, alignCenter)
  const rightFill = boolify(alignLeft, alignHorizontal, alignCenter)

  // Margins:
  const marginRemStyle = useMarginRemStyle({ bottomRem, leftRem, rightRem, topRem, aroundRem, horizontalRem, verticalRem })

  // Direction:
  const flexDirection = row ? 'row' : 'column'

  // Alignment:
  const horizontalAlignment = leftFill && rightFill ? 'center' : rightFill ? 'flex-start' : leftFill ? 'flex-end' : undefined
  const verticalAlignment = topFill && bottomFill ? 'center' : bottomFill ? 'flex-start' : topFill ? 'flex-end' : undefined
  const alignItems = row ? verticalAlignment : horizontalAlignment
  const justifyContent = row ? horizontalAlignment ?? (expand ? 'space-between' : undefined) : verticalAlignment

  // Flex:
  const alignSelf = expand ? 'stretch' : undefined
  const flexGrow = expand ? 1 : undefined

  const spaceStyle: SpaceStyle = useMemo(
    () => ({
      alignSelf,
      alignItems,
      flexGrow,
      flexDirection,
      justifyContent,
      ...marginRemStyle
    }),
    [alignItems, alignSelf, flexDirection, flexGrow, justifyContent, marginRemStyle]
  )

  return <View style={spaceStyle}>{children}</View>
})

const boolify = (...things: Array<boolean | undefined>): boolean => {
  return things.some(thing => {
    return typeof thing === 'boolean' && thing
  })
}
