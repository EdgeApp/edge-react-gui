// @flow

import { StyleSheet } from 'react-native'

import THEME, { DEBUG as debug } from '../../../../theme/variables/airbitz'

export const rawStyles = {
  gradient: {
    height: THEME.HEADER
  },
  view: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  mainScrollView: {
    flex: 1,
    width: '100%',
    alignItems: 'center'
  },
  exchangeRateContainer: {
    alignItems: 'center',
    marginVertical: 12
  },

  main: {
    alignItems: 'center',
    width: '100%'
  },
  feeArea: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  feeAreaText: {
    fontSize: 16,
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },

  pendingSymbolArea: {
    height: 12
  },
  slider: {
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  sliderWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  sliderStyle: {
    width: 270
  },
  error: {
    height: 20,
    marginRight: 5,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  errorText: {
    textAlign: 'left',
    color: THEME.COLORS.ACCENT_RED
  },
  menuTrigger: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  trigger: {
    fontSize: 25,
    color: THEME.COLORS.WHITE,
    fontWeight: '700',
    paddingHorizontal: 8
  },
  optionContainer: {
    width: 165
  },
  optionRow: {
    paddingVertical: 7,
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1
  },
  optionText: {
    fontSize: 16,
    color: THEME.COLORS.GRAY_1
  },
  maxSpend: {
    color: THEME.COLORS.ACCENT_ORANGE
  },
  balanceText: {
    color: THEME.COLORS.WHITE,
    fontSize: 16
  },
  balanceContainer: {
    alignItems: 'center',
    marginTop: 10
  },
  row: {
    alignItems: 'center',
    width: '100%'
  },
  rowText: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    color: THEME.COLORS.WHITE
  },
  pinInputContainer: {
    width: 60,
    height: 50
  },
  pinInputSpacer: {
    width: 10
  },
  activityIndicatorSpace: {
    height: 54,
    paddingVertical: 18
  },
  addUniqueIDButton: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addUniqueIDButtonText: {
    color: THEME.COLORS.WHITE
  },
  activeOpacity: THEME.OPACITY.ACTIVE,
  footer: {},
  debug
}

export default StyleSheet.create(rawStyles)
