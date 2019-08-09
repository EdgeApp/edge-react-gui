// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { scale } from '../../../../util/scaling.js'

export default StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(4),
    borderWidth: 0.5,
    borderColor: THEME.COLORS.GRAY_4,
    alignSelf: 'center',
    padding: scale(10),
    margin: scale(10),
    backgroundColor: THEME.COLORS.GRAY_4
  },
  qrCodeBorder: {
    backgroundColor: THEME.COLORS.WHITE,
    borderRadius: scale(4),
    padding: scale(10)
  },
  qrCodeForeground: {
    color: THEME.COLORS.BLACK
  },
  qrCodeBackground: {
    color: THEME.COLORS.WHITE
  }
})
