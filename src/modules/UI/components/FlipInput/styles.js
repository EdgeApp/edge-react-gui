// @flow

import { Platform, StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { scale } from '../../../../util/scaling.js'

export const styles = StyleSheet.create({
  clipboardContainer: {
    alignItems: 'flex-end',
    height: 0,
    right: 0,
    width: '70%'
  },
  clipboardText: {
    color: THEME.COLORS.BLACK,
    fontSize: scale(16),
    padding: scale(4)
  },
  container: {
    alignSelf: 'center',
    backgroundColor: THEME.COLORS.BLUE_3,
    borderRadius: 5,
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: Platform.OS === 'ios' ? THEME.rem(7.875) : THEME.rem(8.5),
    paddingVertical: scale(12),
    width: '90%'
  },
  flipButton: {
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    justifyContent: 'center',
    marginLeft: scale(13),
    marginRight: scale(9)
  },
  flipContainerBack: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  flipContainerBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  flipContainerFront: {
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  flipContainerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: scale(8)
  },
  flipContainerHeaderIcon: {
    height: scale(22),
    marginLeft: scale(13),
    marginRight: scale(13),
    resizeMode: 'cover',
    width: scale(22)
  },
  flipContainerHeaderText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(15)
  },
  flipContainerHeaderTextContainer: {
    alignItems: 'center',
    color: THEME.COLORS.WHITE,
    flex: 1,
    flexDirection: 'row'
  },
  flipContainerHeaderTextDropDown: {
    color: THEME.COLORS.WHITE,
    marginLeft: scale(3)
  },
  flipIcon: {
    color: THEME.COLORS.GRAY_3
  },
  rows: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    flex: 1,
    flexDirection: 'column',
    marginRight: scale(23)
  }
})

export const top = StyleSheet.create({
  amount: {
    fontFamily: THEME.FONTS.SYMBOLS,
    fontSize: THEME.rem(1.5),
    padding: 0,
    textAlign: 'right',
    width: '100%'
  },
  amountContainer: {
    alignItems: 'flex-end',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  amountPlaceholder: {
    color: THEME.COLORS.GRAY_2,
    fontSize: Platform.OS === 'ios' ? THEME.rem(1.5) : THEME.rem(1)
  },
  currencyCode: {
    color: THEME.COLORS.WHITE,
    fontSize: THEME.rem(1.5),
    marginRight: THEME.rem(0.5),
    textAlign: 'left'
  },
  row: {
    alignItems: 'center',
    borderBottomColor: THEME.COLORS.OPAQUE_WHITE,
    borderBottomWidth: scale(1),
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: scale(4)
  },
  textInput: {
    height: 0,
    position: 'absolute',
    width: 0
  }
})

export const bottom = StyleSheet.create({
  alert: {
    color: THEME.COLORS.WHITE,
    opacity: THEME.OPACITY.MID
  },
  amount: {
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.SYMBOLS,
    fontSize: scale(10),
    opacity: THEME.OPACITY.MID,
    padding: 0,
    textAlign: 'right',
    width: '100%'
  },
  currencyCode: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(10),
    opacity: THEME.OPACITY.MID,
    textAlign: 'right'
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: scale(8)
  }
})
