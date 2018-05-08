// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

export const styles = {
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  stylizedButton: {
    height: THEME.BUTTONS.HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
  }
}

export default StyleSheet.create(styles)
