// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME, { DEBUG as debug } from '../../theme/variables/airbitz'

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
    marginVertical: scale(12)
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
    fontSize: scale(16),
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },

  pendingSymbolArea: {
    height: scale(12)
  },
  slider: {
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  sliderWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  sliderStyle: {
    width: scale(270)
  },
  error: {
    height: scale(20),
    marginRight: scale(5),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  errorText: {
    textAlign: 'left',
    color: THEME.COLORS.ACCENT_RED
  },
  menuTrigger: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4)
  },
  trigger: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    fontWeight: '700',
    paddingHorizontal: scale(8)
  },
  optionContainer: {
    width: scale(165)
  },
  optionRow: {
    paddingVertical: scale(7),
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: scale(1)
  },
  optionText: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_1
  },
  maxSpend: {
    color: THEME.COLORS.ACCENT_ORANGE
  },
  balanceText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16)
  },
  balanceContainer: {
    alignItems: 'center',
    marginTop: scale(10)
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
    width: scale(60),
    height: scale(50)
  },
  pinInputSpacer: {
    width: scale(10)
  },
  activityIndicatorSpace: {
    height: scale(54),
    paddingVertical: scale(18)
  },
  addUniqueIDButton: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    padding: scale(14),
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
