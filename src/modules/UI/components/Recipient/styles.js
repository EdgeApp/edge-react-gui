// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz.js'

export default StyleSheet.create({
  item: {
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    justifyContent: 'center'
  },
  recipient: {
    alignItems: 'center',
    flexDirection: 'column',
    padding: 6,
    width: '100%'
  },
  row: {
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%'
  },
  text: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: 14
  }
})
