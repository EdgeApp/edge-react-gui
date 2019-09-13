// @flow

import React, { type Node } from 'react'
import { Text } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'

/**
 * Use this component just like its HTML equivalent.
 */
export function B (props: { children: Node }) {
  return <Text style={tweakRules.bold}>{props.children}</Text>
}

/**
 * Use this function to build a text style for use on a light background.
 */
export function dayText (...rules: Array<$Keys<typeof dayRules>>): Object {
  const base: Object = {
    color: THEME.COLORS.BLACK,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: textSize.normal
  }
  return Object.assign(base, ...rules.map(rule => dayRules[rule]))
}

/**
 * Use this function to build a text style for use on a dark background.
 */
export function nightText (...rules: Array<$Keys<typeof nightRules>>): Object {
  const base: Object = {
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: textSize.normal
  }
  return Object.assign(base, ...rules.map(rule => nightRules[rule]))
}

// Common text sizes:
export const textSize = {
  largest: THEME.rem(1.414), // 2 ^ 0.5
  large: THEME.rem(1.189), // 2 ^ 0.25
  normal: THEME.rem(1),
  small: THEME.rem(0.84), // 2 ^ -0.25
  smallest: THEME.rem(0.707) // 2 ^ -0.5
}

// Font modifiers:
const tweakRules = {
  bold: { fontFamily: THEME.FONTS.BOLD },
  small: { fontSize: textSize.small },
  large: { fontSize: textSize.large }
}

// Alignment schemes:
const alignmentRules = {
  // These work as expected within a `flex-direction: 'column'` container:
  center: { textAlign: 'center', alignSelf: 'center' },
  left: { textAlign: 'left', alignSelf: 'stretch' },
  right: { textAlign: 'right', alignSelf: 'stretch' },

  // Centers signle-line text, or left-justifies multi-line text
  // within a `flex-direction: 'column'` container:
  autoCenter: { textAlign: 'left', alignSelf: 'center' },

  // These work within a `flex-direction: 'row'` container:
  'row-center': { textAlign: 'center', flexShrink: 1 },
  'row-left': { textAlign: 'left', flexShrink: 1 },
  'row-right': { textAlign: 'right', flexShrink: 1 }
}

// Color rules for light backgrounds:
const dayRules = {
  ...tweakRules,
  ...alignmentRules,

  link: {
    color: THEME.COLORS.ACCENT_BLUE
  },
  title: {
    color: THEME.COLORS.PRIMARY,
    ...alignmentRules.center,
    ...tweakRules.large
  }
}

// Color rules for dark backgrounds:
const nightRules = {
  ...tweakRules,
  ...alignmentRules,

  link: {
    textDecoration: 'underline'
  },
  title: {
    ...alignmentRules.center,
    ...tweakRules.large
  }
}
