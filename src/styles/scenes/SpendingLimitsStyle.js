// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'

const debug = {
  borderColor: 'red',
  borderWidth: 1
}
export const rawStyles = {
  scene: {
    padding: 24,
    backgroundColor: THEME.COLORS.WHITE
  },
  spacer: {
    height: 28
  },
  gradient: {
    height: THEME.HEADER
  },
  item: {},
  passwordInput: {},
  bodyText: {
    color: THEME.COLORS.PRIMARY,
    fontFamily: THEME.FONTS.DEFAULT
  },
  spendingLimit: {},
  dailySpendingLimit: {},
  transactionSpendingLimit: {},
  submitButton: {},
  debug
}
export const styles = StyleSheet.create(rawStyles)
export default styles
