// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  searchResultsContainer: {
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.GRAY_3,
    position: 'absolute',
    backgroundColor: THEME.COLORS.WHITE,
    zIndex: 999
  }
})
