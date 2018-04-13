/* eslint-disable flowtype/require-valid-file-annotation */

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  container: {
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: THEME.COLORS.GRAY_4,
    alignSelf: 'center',
    alignItems: 'center',
    padding: 10,
    margin: 10,
    backgroundColor: THEME.COLORS.GRAY_4
  },
  qrCodeBorder: {
    backgroundColor: THEME.COLORS.WHITE,
    borderRadius: 4,
    padding: 10
  },
  qrCodeForeground: {
    color: THEME.COLORS.BLACK
  },
  qrCodeBackground: {
    color: THEME.COLORS.WHITE
  }
})
