// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../../theme/variables/airbitz.js'

export const styles = {
  //  ALL BUTTONS
  button: {
    height: 55,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: 16
  },

  // PRIMARY BUTTON
  primaryButton: {
    backgroundColor: THEME.COLORS.PRIMARY
  },
  primaryButtonUnderlay: { color: THEME.COLORS.PRIMARY },
  primaryButtonText: {
    color: THEME.COLORS.PRIMARY
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
    borderColor: THEME.COLORS.SECONDARY
  },
  tertiaryButtonUnderlay: { color: THEME.COLORS.GRAY_3 },
  tertiaryButtonText: {
    color: THEME.COLORS.PRIMARY
  }
}

export default StyleSheet.create(styles)
