// @flow

import * as React from 'react'
import LinearGradient from 'react-native-linear-gradient'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type Props = {
  // The gap around the line. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  marginRem?: number | number[],
  colors?: string[]
}

const start = { x: 0, y: 0.5 }
const end = { x: 1, y: 0.5 }

/**
 * A horizontal line for dividing sections of the app.
 *
 * This is designed to "stick out" to the right of the content area,
 * touching the edge of the screen. Just add the same horizontal
 * margin to this component as you would to its siblings,
 * such as buttons or text fields, and everything will line up.
 */
export const DividerLine = (props: Props) => {
  const { marginRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
  margin.marginRight -= theme.rem(1)

  const colors = props.colors ?? theme.dividerLineColors

  return <LinearGradient colors={colors} start={start} end={end} style={[styles.underline, margin]} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  underline: {
    height: theme.dividerLineHeight,
    alignSelf: 'stretch'
  }
}))
