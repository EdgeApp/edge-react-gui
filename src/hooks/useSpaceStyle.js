// @flow

import { type StyleSheet } from 'react-native'

import { useTheme } from '../components/services/ThemeContext'

export type SpaceProps = {
  // Compond space adjectives:
  around?: boolean | number,
  horizontal?: boolean | number,
  veritcal?: boolean | number,
  // Unit space adjectives:
  top?: boolean | number,
  right?: boolean | number,
  bottom?: boolean | number,
  left?: boolean | number,
  // Direction:
  sideways?: boolean,
  // Alignment:
  start?: boolean,
  center?: boolean,
  end?: boolean
}

export const useSpaceStyle = (props: SpaceProps): StyleSheet.Styles => {
  const theme = useTheme()
  const { around, horizontal, veritcal } = props

  const top = around ?? veritcal ?? props.top
  const bottom = around ?? veritcal ?? props.bottom
  const left = around ?? horizontal ?? props.left
  const right = around ?? horizontal ?? props.right

  const paddingTop = theme.rem(typeof top === 'number' ? top : top ? 1 : 0)
  const paddingBottom = theme.rem(typeof bottom === 'number' ? bottom : bottom ? 1 : 0)
  const paddingLeft = theme.rem(typeof left === 'number' ? left : left ? 1 : 0)
  const paddingRight = theme.rem(typeof right === 'number' ? right : right ? 1 : 0)

  // Direction:
  const { sideways = false } = props
  const flexDirection = sideways ? 'row' : 'column'

  // Alignment:
  const { start = false, center = false, end = false } = props
  const alignItems = start ? 'flex-start' : center ? 'center' : end ? 'flex-end' : null

  return {
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    flexDirection,
    alignItems
  }
}
