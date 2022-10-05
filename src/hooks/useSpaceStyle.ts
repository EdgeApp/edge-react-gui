import { ViewStyle } from 'react-native'

import { useTheme } from '../components/services/ThemeContext'

export type SpaceProps = {
  // Compond space adjectives:
  around?: boolean | number
  horizontal?: boolean | number
  vertical?: boolean | number
  isFill?: boolean
  // Unit space adjectives:
  top?: boolean | number
  right?: boolean | number
  bottom?: boolean | number
  left?: boolean | number
  // Direction:
  isSideways?: boolean
  // Alignment:
  isGroupStart?: boolean
  isGroupCenter?: boolean
  isGroupEnd?: boolean
  isItemStart?: boolean
  isItemCenter?: boolean
  isItemEnd?: boolean
}

export const useSpaceStyle = (props: SpaceProps): ViewStyle => {
  const theme = useTheme()
  const { around, horizontal, vertical } = props

  const flex = props.isFill ? 1 : undefined

  const top = around ?? vertical ?? props.top
  const bottom = around ?? vertical ?? props.bottom
  const left = around ?? horizontal ?? props.left
  const right = around ?? horizontal ?? props.right

  const paddingTop = theme.rem(typeof top === 'number' ? top : top ? 1 : 0)
  const paddingBottom = theme.rem(typeof bottom === 'number' ? bottom : bottom ? 1 : 0)
  const paddingLeft = theme.rem(typeof left === 'number' ? left : left ? 1 : 0)
  const paddingRight = theme.rem(typeof right === 'number' ? right : right ? 1 : 0)

  // Direction:
  const { isSideways: sideways = false } = props
  const flexDirection = sideways ? 'row' : 'column'

  // Alignment:
  const { isItemStart = false, isItemCenter = false, isItemEnd = false, isGroupStart = false, isGroupCenter = false, isGroupEnd = false } = props
  const alignItems = isItemStart ? 'flex-start' : isItemCenter ? 'center' : isItemEnd ? 'flex-end' : undefined
  const justifyContent = isGroupStart ? 'flex-start' : isGroupCenter ? 'center' : isGroupEnd ? 'flex-end' : undefined

  return {
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    flex,
    flexDirection,
    alignItems,
    justifyContent
  }
}
