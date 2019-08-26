// @flow

import { StyleSheet } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'

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
