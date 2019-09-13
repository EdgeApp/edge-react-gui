// @flow

import { StyleSheet } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'

export const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: THEME.COLORS.WHITE,
    padding: THEME.rem(1.4)
  },

  // Radio input:
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.rem(1)
  },
  radio: {
    borderRadius: THEME.rem(0.5),
    marginRight: THEME.rem(0.5),
    width: THEME.rem(1),
    height: THEME.rem(1),
    borderWidth: THEME.rem(1 / 16),
    borderColor: THEME.COLORS.GRAY_2
  },
  selected: {
    borderColor: THEME.COLORS.ACCENT_BLUE,
    backgroundColor: THEME.COLORS.ACCENT_BLUE
  },

  // Custom fee area:
  customArea: {
    marginBottom: THEME.rem(1)
  },

  // Warning box:
  warningBox: {
    padding: THEME.rem(0.5),

    backgroundColor: THEME.COLORS.ACCENT_ORANGE,
    borderRadius: THEME.rem(0.5),

    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between'
  }
})
