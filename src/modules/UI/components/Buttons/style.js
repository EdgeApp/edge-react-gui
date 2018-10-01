// @flow

import { StyleSheet } from 'react-native'
import { scale } from '../../../../lib/scaling.js'
import THEME from '../../../../theme/variables/airbitz'

export const rawStyles = {
  button: {
    padding: 14,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: -1
  },
  buttonText: {
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: 18,
    lineHeight: 18,
    position: 'relative',
    top: 1
  },
  buttonTextScaled: {
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: scale(18),
    lineHeight: scale(18)
  },
  text: {
    fontFamily: THEME.FONTS.DEFAULT
  },
  // PRIMARY BUTTON
  primaryButton: {
    backgroundColor: THEME.COLORS.SECONDARY
  },
  primaryButtonUnderlay: { color: THEME.COLORS.PRIMARY },
  primaryButtonText: {
    color: THEME.COLORS.WHITE
  },

  // SECONDARY BUTTON
  secondaryButton: {
    backgroundColor: THEME.COLORS.GRAY_2
  },
  secondaryButtonUnderlay: { color: THEME.COLORS.GRAY_1 },
  secondaryButtonText: {
    color: THEME.COLORS.WHITE
  },

  //  TERTIARY BUTTON
  tertiaryButton: {
    backgroundColor: THEME.COLORS.WHITE,
    borderWidth: 2,
    borderColor: THEME.COLORS.SECONDARY,
    padding: 12
  },
  tertiaryButtonUnderlay: { color: THEME.COLORS.GRAY_3 },
  tertiaryButtonText: {
    color: THEME.COLORS.PRIMARY
  },
  // Text BUTTON
  textButton: {
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  textButtonUnderlay: { color: THEME.COLORS.TRANSPARENT },
  textButtonText: {
    color: THEME.COLORS.WHITE
  },

  debug: {
    borderColor: 'red',
    borderWidth: 1
  }
}

export const styles = StyleSheet.create(rawStyles)
