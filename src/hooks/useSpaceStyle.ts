import { ViewStyle } from 'react-native'

import { useTheme } from '../components/services/ThemeContext'

export interface SpaceProps {
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

  const top = numberify(around ?? vertical ?? props.top ?? 0)
  const bottom = numberify(around ?? vertical ?? props.bottom ?? 0)
  const left = numberify(around ?? horizontal ?? props.left ?? 0)
  const right = numberify(around ?? horizontal ?? props.right ?? 0)

  const marginTop = theme.rem(typeof top === 'number' ? top : top ? 1 : 0)
  const marginBottom = theme.rem(typeof bottom === 'number' ? bottom : bottom ? 1 : 0)
  const marginLeft = theme.rem(typeof left === 'number' ? left : left ? 1 : 0)
  const marginRight = theme.rem(typeof right === 'number' ? right : right ? 1 : 0)

  // Direction:
  const { isSideways: sideways = false } = props
  const flexDirection = sideways ? 'row' : 'column'

  // Alignment:
  const { isItemStart = false, isItemCenter = false, isItemEnd = false, isGroupStart = false, isGroupCenter = false, isGroupEnd = false } = props
  const alignItems = isItemStart ? 'flex-start' : isItemCenter ? 'center' : isItemEnd ? 'flex-end' : undefined
  const justifyContent = isGroupStart ? 'flex-start' : isGroupCenter ? 'center' : isGroupEnd ? 'flex-end' : undefined

  return {
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    flex,
    flexDirection,
    alignItems,
    justifyContent
  }
}

const numberify = (thing: boolean | number): number => (typeof thing === 'number' ? thing : thing ? 1 : 0)
