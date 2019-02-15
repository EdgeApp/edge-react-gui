// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'

export const styles = {
  addWalletButton: {
    marginBottom: scale(15)
  },
  addWalletContentWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: scale(15)
  },
  addWalletIcon: {
    justifyContent: 'center',
    marginRight: scale(12),
    position: 'relative',
    top: scale(1)
  },
  addWalletText: {
    fontSize: scale(18),
    position: 'relative',
    top: scale(2),
    flexDirection: 'column',
    justifyContent: 'center',
    color: THEME.COLORS.GRAY_1
  }
}

export const addWalletStyle = StyleSheet.create(styles)
