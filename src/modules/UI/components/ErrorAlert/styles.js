// @flow
import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz.js'

export default StyleSheet.create({
  alertContainer: {
    flex: 1,
    padding: 5,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.GRAY_3
  },
  alertHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.GRAY_3
  },
  alertHeaderText: {
    color: THEME.COLORS.GRAY_1
  },
  alertIcon: {
    color: THEME.COLORS.ACCENT_RED,
    paddingHorizontal: 10
  },
  infoIcon: {
    color: THEME.COLORS.PRIMARY,
    paddingHorizontal: 10
  }
})
