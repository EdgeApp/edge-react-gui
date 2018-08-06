// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

export const rawStyles = {
  /*buttonsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  stylizedButton: {
    height: THEME.BUTTONS.HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 3
  },
  stylizedButtonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 16,
    fontFamily: THEME.FONTS.DEFAULT
  },
  text: {
    fontFamily: THEME.FONTS.DEFAULT
  },
  primaryButtonWrap: {
    backgroundColor: THEME.COLORS.SECONDARY
  },
  primaryUnderlay: {
    color: THEME.COLORS.PRIMARY
  },
  primaryButtonText: {
    color: THEME.COLORS.GRADIENT.LIGHT
  },

  secondaryButtonWrap: {
    backgroundColor: THEME.COLORS.GRAY_2,
    alignSelf: 'flex-start'
  },
  secondaryButtonText: {
    color: THEME.COLORS.GRADIENT.LIGHT
  },
  secondaryUnderlay: {
    color: THEME.COLORS.GRAY_1
  },
  tertiaryButtonWrap: {
    backgroundColor: THEME.COLORS.WHITE,
    borderWidth: 1,
    borderColor: THEME.COLORS.SECONDARY
  },
  tertiaryButtonTextWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center'
  },
  tertiaryButtonText: {
    color: THEME.COLORS.SECONDARY
  },
  tertiaryUnderlay: {
    color: THEME.COLORS.GRAY_3
  },*/
  button: {
    padding: 14,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: 18
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
    borderColor: THEME.COLORS.SECONDARY
  },
  tertiaryButtonUnderlay: { color: THEME.COLORS.GRAY_3 },
  tertiaryButtonText: {
    color: THEME.COLORS.PRIMARY
  },

  debug: {
    borderColor: 'red',
    borderWidth: 1
  }  
}

export const styles = StyleSheet.create(rawStyles)
