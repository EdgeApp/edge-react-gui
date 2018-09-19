// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../../../lib/scaling.js'
import THEME from '../../../../theme/variables/airbitz'

export const styles = StyleSheet.create({
  container: {
    height: scale(110),
    marginVertical: 0,
    marginHorizontal: scale(14),
    alignSelf: 'stretch',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    flexDirection: 'row'
  },
  flipContainerFront: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
    backfaceVisibility: 'hidden'
  },
  flipContainerBack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  flipButton: {
    flex: 1,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    marginRight: scale(10),
    justifyContent: 'space-around'
  },
  flipIcon: {
    color: THEME.COLORS.GRAY_3
  },
  spacer: {
    flex: 1,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  rows: {
    flex: 8,
    flexDirection: 'column',
    backgroundColor: THEME.COLORS.TRANSPARENT
  }
})

export const top = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    borderBottomColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: scale(1)
  },
  symbol: {
    flex: 2,
    fontSize: scale(15),
    color: THEME.COLORS.WHITE,
    textAlign: 'left',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontFamily: THEME.FONTS.SYMBOLS
  },
  amount: {
    flex: 6,
    fontSize: 30,
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currencyCode: {
    flex: 2,
    fontSize: scale(10),
    lineHeight: scale(20),
    color: THEME.COLORS.WHITE,
    textAlign: 'right',
    backgroundColor: THEME.COLORS.TRANSPARENT
  }
})

export const bottom = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  symbol: {
    flex: 3,
    fontSize: scale(16),
    color: THEME.COLORS.WHITE,
    textAlign: 'left',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  amount: {
    flex: 6,
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currencyCode: {
    flex: 3,
    fontSize: scale(10),
    color: THEME.COLORS.WHITE,
    textAlign: 'right',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  alert: {
    color: THEME.COLORS.WHITE,
    opacity: THEME.OPACITY.MID
  }
})
