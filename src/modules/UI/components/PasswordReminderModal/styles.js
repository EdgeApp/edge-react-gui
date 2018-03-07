// @flow

import { StyleSheet } from 'react-native'

import { THEME } from '../../../../theme/variables/airbitz.js'

export const styles = StyleSheet.create({
  icon: {
    color: THEME.COLORS.SECONDARY,
    position: 'relative',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 40
  },
  descriptionTop: {
    paddingBottom: 15
  },
  descriptionBottom: {
    paddingTop: 15
  },
  passwordInput: {
    color: THEME.COLORS.GRAY_2
  },
  footer: {
    paddingTop: 10
  },
  buttonContainer: {
    paddingVertical: 3
  }
})
