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
  row: {
    height: scale(100),
    justifyContent: 'space-between',
    paddingTop: scale(40)
  },
  lineRow: {
    justifyContent: 'center',
    paddingLeft: scale(50),
    paddingRight: scale(50),
    paddingTop: 0
  },
  title: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  titleRejected: {
    color: THEME.COLORS.ACCENT_RED
  },
  titleReceived: {
    color: THEME.COLORS.ACCENT_MINT
  }
})
