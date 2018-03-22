// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz.js'

export default StyleSheet.create({
  dropdownContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.PRIMARY
  },
  dropdownHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.GRAY_3
  },
  dropdownHeaderText: {
    color: THEME.COLORS.GRAY_1
  }
})
