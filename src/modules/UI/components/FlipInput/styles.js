// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform.js'
import { scale } from '../../../../util/scaling.js'

export const styles = StyleSheet.create({
  container: {
    width: '90%',
    minHeight: PLATFORM.platform === 'ios' ? scale(110) : scale(120),
    backgroundColor: THEME.COLORS.BLUE_3,
    borderRadius: 5,
    flexDirection: 'column',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingVertical: scale(12)
  },
  flipContainerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: scale(8)
  },
  flipContainerHeaderIcon: {
    height: scale(22),
    width: scale(22),
    marginLeft: scale(13),
    marginRight: scale(13),
    resizeMode: 'cover'
  },
  flipContainerHeaderTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    color: THEME.COLORS.WHITE
  },
  flipContainerHeaderText: {
    fontSize: scale(15),
    color: THEME.COLORS.WHITE
  },
  flipContainerHeaderTextDropDown: {
    marginLeft: scale(3),
    color: THEME.COLORS.WHITE
  },
  flipContainerBody: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  flipContainerFront: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
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
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: scale(13),
    marginRight: scale(9),
    alignItems: 'center',
    justifyContent: 'center'
  },
  flipIcon: {
    color: THEME.COLORS.GRAY_3
  },
  rows: {
    flex: 1,
    flexDirection: 'column',
    marginRight: scale(23),
    backgroundColor: THEME.COLORS.TRANSPARENT
  }
})

export const top = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: scale(8),
    borderBottomColor: THEME.COLORS.OPAQUE_WHITE,
    borderBottomWidth: scale(1)
  },
  amountContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end'
  },
  symbol: {
    fontSize: scale(15),
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.SYMBOLS,
    marginRight: scale(5),
    textAlign: 'right'
  },
  amount: {
    fontSize: scale(15),
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.SYMBOLS,
    textAlign: 'right',
    padding: 0
  },
  currencyCode: {
    fontSize: scale(15),
    color: THEME.COLORS.WHITE,
    textAlign: 'left'
  }
})

export const bottom = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scale(8)
  },
  amountContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  symbol: {
    fontSize: scale(10),
    color: THEME.COLORS.WHITE,
    opacity: THEME.OPACITY.MID,
    fontFamily: THEME.FONTS.SYMBOLS,
    marginRight: scale(5),
    textAlign: 'right'
  },
  amount: {
    fontSize: scale(10),
    color: THEME.COLORS.WHITE,
    opacity: THEME.OPACITY.MID,
    fontFamily: THEME.FONTS.SYMBOLS,
    textAlign: 'right',
    padding: 0
  },
  currencyCode: {
    fontSize: scale(10),
    color: THEME.COLORS.WHITE,
    opacity: THEME.OPACITY.MID,
    textAlign: 'right'
  },
  alert: {
    color: THEME.COLORS.WHITE,
    opacity: THEME.OPACITY.MID
  }
})
