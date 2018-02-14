// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz.js'

export default StyleSheet.create({
  alertContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.PRIMARY
  },
  alertHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  alertHeaderText: {
    color: THEME.COLORS.WHITE
  },
  checkmarkIcon: {
    color: THEME.COLORS.ACCENT_MINT,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 35,
    paddingHorizontal: 15
  }
})
