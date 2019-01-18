// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'

export const styles = {
  buyMultipleCryptoContainer: {
    height: scale(140),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(15)
  },
  buyMultipleCryptoBox: {
    flex: 2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  buyMultipleCryptoBoxImage: {
    width: scale(40),
    height: scale(40),
    marginHorizontal: scale(3)
  },
  buyMultipleCryptoBoxText: {
    marginTop: scale(10),
    fontSize: scale(17),
    color: THEME.COLORS.GRAY_1
  }
}

export default StyleSheet.create(styles)
