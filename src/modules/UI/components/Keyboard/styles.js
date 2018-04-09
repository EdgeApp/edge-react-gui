/* eslint-disable flowtype/require-valid-file-annotation */

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  view: {
    flex: 1,
    borderColor: THEME.COLORS.ACCENT_RED,
    borderWidth: 1
  },
  keyboard: {
    flex: 1,
    borderColor: THEME.COLORS.ACCENT_RED,
    borderWidth: 1
  },
  row: {
    flex: 1,
    flexDirection: 'row'
  },
  calculation: {
    flex: 1,
    color: THEME.COLORS.BLACK
  }
})
