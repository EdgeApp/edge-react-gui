// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

export const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  exchangeRateContainer: {
    alignItems: 'center',
    marginBottom: scale(10)
  },

  // The white background is a theme-independent part of the QR code:
  // eslint-disable-next-line react-native/no-color-literals
  qrContainer: {
    backgroundColor: THEME.COLORS.QR_CODE_THEME_INDEPENDENT_WHITE,
    marginTop: scale(15),
    borderRadius: scale(4),
    padding: scale(4)
  },

  shareButtonsContainer: {
    alignItems: 'stretch',
    justifyContent: 'center'
  },
  accessoryView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.WHITE
  },
  accessoryBtn: {
    paddingVertical: scale(7),
    paddingHorizontal: scale(15)
  },
  accessoryText: {
    color: THEME.COLORS.ACCENT_BLUE,
    fontSize: scale(16)
  }
})
