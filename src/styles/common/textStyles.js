// @flow

import React, { type Node } from 'react'
import { StyleSheet, Text } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'

export function B (props: { children: Node }) {
  return <Text style={textStyles.bold}>{props.children}</Text>
}

const rawStyles = {
  bold: {
    fontFamily: THEME.FONTS.BOLD
  },

  // "body" means light background
  bodyTitle: {
    color: THEME.COLORS.PRIMARY,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: THEME.rem(1.2),
    textAlign: 'center'
  },

  bodyParagraph: {
    color: THEME.COLORS.BLACK,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: THEME.rem(1),
    textAlign: 'justify'
  },

  bodyCenter: {
    color: THEME.COLORS.BLACK,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: THEME.rem(1),
    textAlign: 'center'
  }
}

export const textStyles: typeof rawStyles = StyleSheet.create(rawStyles)
