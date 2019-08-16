// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz.js'

export default StyleSheet.create({
  recipient: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
    padding: 6
  },
  row: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  item: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: 14
  }
})
