// @flow
import { StyleSheet } from 'react-native'

import { THEME } from '../../../../../../theme/variables/airbitz.js'

export const rawStyles = {
  totalBalanceBox: {
    // one
    height: 111,
    justifyContent: 'center'
  },
  totalBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  totalBalanceHeader: {
    flex: 2,
    justifyContent: 'flex-end',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  totalBalanceText: {
    fontSize: 18,
    color: THEME.COLORS.PRIMARY
  },
  currentBalanceBoxDollarsWrap: {
    flex: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  hiddenBalanceBoxDollarsWrap: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxDollars: {
    color: THEME.COLORS.PRIMARY,
    fontSize: 44
  }
}

export const styles = StyleSheet.create(rawStyles)
