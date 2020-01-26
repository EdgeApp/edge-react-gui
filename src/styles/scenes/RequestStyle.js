// @flow

import { StyleSheet } from 'react-native'

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
    backgroundColor: 'white',
    marginTop: scale(15),
    borderRadius: scale(4),
    padding: scale(4)
  },

  shareButtonsContainer: {
    alignItems: 'stretch',
    justifyContent: 'center'
  }
})
