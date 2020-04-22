// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

export const styles = StyleSheet.create({
  line: {
    backgroundColor: THEME.COLORS.WHITE,
    height: 0,
    paddingLeft: scale(50),
    paddingRight: scale(50)
  },
  memo: {
    paddingLeft: scale(50),
    paddingRight: scale(50)
  },
  row: {
    height: scale(80),
    justifyContent: 'space-between',
    paddingTop: scale(30)
  },
  lineRow: {
    display: 'flex',
    justifyContent: 'center',
    paddingLeft: scale(50),
    paddingRight: scale(50),
    paddingTop: 0
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    height: scale(44),
    paddingTop: 0,
    paddingLeft: scale(50),
    paddingRight: scale(50)
  },
  title: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  value: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(18),
    fontWeight: 'bold',
    textAlign: 'center'
  },
  selectWalletBtn: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.OPACITY_WHITE
  }
})
