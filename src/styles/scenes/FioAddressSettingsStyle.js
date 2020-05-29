// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'

export const styles = StyleSheet.create({
  info: {
    backgroundColor: THEME.COLORS.SECONDARY,
    paddingVertical: THEME.rem(1),
    paddingHorizontal: THEME.rem(1),
    marginBottom: THEME.rem(0.25)
  },
  title: {
    color: THEME.COLORS.TRANSACTION_DETAILS_GREY_1,
    marginBottom: THEME.rem(0.25),
    fontSize: THEME.rem(0.75),
    fontWeight: 'normal',
    textAlign: 'left'
  },
  content: {
    color: THEME.COLORS.WHITE,
    fontSize: THEME.rem(1),
    textAlign: 'left'
  },
  texts: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  balanceTitle: {
    fontSize: THEME.rem(1),
    color: THEME.COLORS.WHITE,
    textAlign: 'center'
  },
  balanceTitleDisabled: {
    fontSize: THEME.rem(1),
    color: THEME.COLORS.ACCENT_RED,
    fontWeight: 'normal',
    textAlign: 'center'
  },
  blockPadding: {
    paddingTop: THEME.rem(2),
    paddingLeft: THEME.rem(1.25),
    paddingRight: THEME.rem(1.25)
  },
  spacer: {
    paddingTop: THEME.rem(1.25)
  },
  activityIndicator: {
    marginTop: THEME.rem(3.25),
    alignSelf: 'center'
  }
})
