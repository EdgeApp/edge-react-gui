// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  container: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    flexDirection: 'row',
    marginVertical: 15,
    marginHorizontal: 35
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: 14,
    marginHorizontal: 5
  }
})
