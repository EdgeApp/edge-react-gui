// @flow
import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import { THEME } from '../../theme/variables/airbitz.js'

export const rawStyles = {
  totalBalanceBox: {
    // one
    height: scale(111),
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
    fontSize: scale(18),
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
    fontSize: scale(44)
  },
  currentBalanceBoxNoExchangeRates: {
    color: THEME.COLORS.PRIMARY,
    fontSize: scale(26),
    textAlign: 'center'
  }
}

export const styles = StyleSheet.create(rawStyles)
