import { StyleSheet } from 'react-native'

import { THEME } from '../../../../theme/variables/airbitz'
import { scale } from '../../../../util/scaling'

export const primaryButtonUnderlay = { color: THEME.COLORS.PRIMARY }
export const secondaryButtonUnderlay = { color: THEME.COLORS.GRAY_1 }
export const tertiaryButtonUnderlay = { color: THEME.COLORS.GRAY_3 }

export const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: -1
  },
  buttonText: {
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: scale(18),
    lineHeight: scale(18),
    position: 'relative',
    top: 1
  },
  text: {
    fontFamily: THEME.FONTS.DEFAULT
  },
  // PRIMARY BUTTON
  primaryButton: {
    backgroundColor: THEME.COLORS.SECONDARY
  },
  primaryButtonText: {
    color: THEME.COLORS.WHITE
  },

  // SECONDARY BUTTON
  secondaryButton: {
    backgroundColor: THEME.COLORS.GRAY_2
  },
  secondaryButtonText: {
    color: THEME.COLORS.WHITE
  },

  //  TERTIARY BUTTON
  tertiaryButton: {
    backgroundColor: THEME.COLORS.WHITE,
    borderWidth: 2,
    borderColor: THEME.COLORS.SECONDARY,
    padding: scale(12)
  },
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
  }
})
